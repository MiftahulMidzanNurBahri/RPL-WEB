import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { authenticatedUser, requireAuth } from "../middleware/auth.js";
import { ApiError } from "../lib/errors.js";
import { itemDto, paginationDto, userDto } from "../lib/dto.js";
import { prisma } from "../lib/prisma.js";
import { profileFields } from "../lib/schemas.js";
import { parseInput, paginationSchema } from "../lib/validation.js";
import { inquiryCreateSchema, inquiryUpdateSchema } from "../lib/schemas.js";
import { scoreMatch } from "../services/matching.js";

export const domainRouter = Router();

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: { code: "RATE_LIMITED", message: "Batas pengiriman pesan tercapai. Coba lagi nanti.", fields: {} }
  }
});

const participantSelect = { id: true, name: true, avatarInitials: true } as const;
const itemOwnerSelect = { id: true, name: true, avatarInitials: true } as const;

domainRouter.get("/dashboard/summary", async (_request, response) => {
  const [lostActive, foundActive, returned, latestItems] = await Promise.all([
    prisma.item.count({ where: { status: "lost", deletedAt: null } }),
    prisma.item.count({ where: { status: "found", deletedAt: null } }),
    prisma.item.count({ where: { status: "returned", deletedAt: null } }),
    prisma.item.findMany({
      where: { deletedAt: null },
      include: { reporter: { select: itemOwnerSelect } },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);
  response.json({
    data: {
      lostActive,
      foundActive,
      returned,
      latestItems: latestItems.map((item) => itemDto(item))
    }
  });
});

async function findMatches(userId: string) {
  const ownItems = await prisma.item.findMany({
    where: { reporterId: userId, status: { in: ["lost", "found"] }, deletedAt: null }
  });
  const candidateItems = await prisma.item.findMany({
    where: {
      reporterId: { not: userId },
      status: { in: ["lost", "found"] },
      deletedAt: null
    },
    include: { reporter: { select: itemOwnerSelect } }
  });

  return ownItems.flatMap((ownItem) => candidateItems
    .filter((candidate) => candidate.reportType !== ownItem.reportType)
    .map((candidate) => {
      const result = scoreMatch(ownItem, candidate);
      if (result.score < 30) return null;
      return {
        ownItem: itemDto(ownItem, { isMine: true, includePrivate: true }),
        candidate: itemDto(candidate),
        score: result.score,
        percentage: Math.round((result.score / 105) * 100),
        reasons: result.reasons
      };
    })
    .filter((match) => match !== null))
    .sort((first, second) => second.score - first.score);
}

domainRouter.get("/matches", requireAuth, async (request, response) => {
  const query = parseInput(paginationSchema.extend({ itemId: z.string().max(100).optional() }).strict(), request.query);
  const userId = authenticatedUser(request).id;
  let matches = await findMatches(userId);
  if (query.itemId) matches = matches.filter((match) => match.ownItem.id === query.itemId);
  const total = matches.length;
  const start = (query.page - 1) * query.pageSize;
  response.json({
    data: matches.slice(start, start + query.pageSize),
    pagination: paginationDto(query.page, query.pageSize, total)
  });
});

domainRouter.get("/dashboard/me", requireAuth, async (request, response) => {
  const userId = authenticatedUser(request).id;
  const [lost, found, returned, matches, recentItems] = await Promise.all([
    prisma.item.count({ where: { reporterId: userId, status: "lost", deletedAt: null } }),
    prisma.item.count({ where: { reporterId: userId, status: "found", deletedAt: null } }),
    prisma.item.count({ where: { reporterId: userId, status: "returned", deletedAt: null } }),
    findMatches(userId),
    prisma.item.findMany({
      where: { reporterId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);
  response.json({
    data: {
      lost,
      found,
      returned,
      matchCount: matches.length,
      recentItems: recentItems.map((item) => itemDto(item, { isMine: true, includePrivate: true }))
    }
  });
});

domainRouter.post("/items/:id/inquiries", requireAuth, inquiryLimiter, async (request, response) => {
  const input = parseInput(inquiryCreateSchema, request.body);
  const user = authenticatedUser(request);
  const itemId = request.params.id;
  if (typeof itemId !== "string") throw new ApiError(400, "INVALID_ITEM_ID", "ID laporan tidak valid.");
  const item = await prisma.item.findFirst({
    where: { id: itemId, deletedAt: null },
    select: { id: true, reporterId: true, title: true, status: true }
  });
  if (!item) throw new ApiError(404, "ITEM_NOT_FOUND", "Laporan barang tidak ditemukan.");
  if (item.reporterId === user.id) throw new ApiError(400, "OWN_ITEM", "Anda tidak dapat menghubungi diri sendiri.");
  if (item.status === "returned") throw new ApiError(409, "ITEM_ALREADY_RETURNED", "Laporan barang sudah selesai.");

  const inquiry = await prisma.$transaction(async (transaction) => {
    const created = await transaction.inquiry.create({
      data: {
        itemId: item.id,
        senderId: user.id,
        recipientId: item.reporterId,
        kind: input.kind,
        message: input.message
      },
      include: {
        item: { select: { id: true, title: true } },
        sender: { select: participantSelect },
        recipient: { select: participantSelect }
      }
    });
    await transaction.activityLog.create({
      data: { userId: user.id, itemId: item.id, action: `Mengirim pesan terkait laporan ${item.title}` }
    });
    await transaction.activityLog.create({
      data: { userId: item.reporterId, itemId: item.id, action: `Menerima pesan terkait laporan ${item.title}` }
    });
    return created;
  });
  response.status(201).json({ data: inquiry });
});

domainRouter.get("/inquiries", requireAuth, async (request, response) => {
  const query = parseInput(paginationSchema, request.query);
  const userId = authenticatedUser(request).id;
  const where = { OR: [{ senderId: userId }, { recipientId: userId }] };
  const [inquiries, total] = await prisma.$transaction([
    prisma.inquiry.findMany({
      where,
      include: {
        item: { select: { id: true, title: true } },
        sender: { select: participantSelect },
        recipient: { select: participantSelect }
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    }),
    prisma.inquiry.count({ where })
  ]);
  response.json({ data: inquiries, pagination: paginationDto(query.page, query.pageSize, total) });
});

domainRouter.get("/inquiries/:id", requireAuth, async (request, response) => {
  const inquiryId = request.params.id;
  if (typeof inquiryId !== "string") throw new ApiError(400, "INVALID_INQUIRY_ID", "ID pesan tidak valid.");
  const userId = authenticatedUser(request).id;
  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, OR: [{ senderId: userId }, { recipientId: userId }] },
    include: {
      item: { select: { id: true, title: true } },
      sender: { select: participantSelect },
      recipient: { select: participantSelect }
    }
  });
  if (!inquiry) throw new ApiError(404, "INQUIRY_NOT_FOUND", "Pesan tidak ditemukan.");
  response.json({ data: inquiry });
});

domainRouter.patch("/inquiries/:id", requireAuth, async (request, response) => {
  const input = parseInput(inquiryUpdateSchema, request.body);
  const inquiryId = request.params.id;
  if (typeof inquiryId !== "string") throw new ApiError(400, "INVALID_INQUIRY_ID", "ID pesan tidak valid.");
  const userId = authenticatedUser(request).id;
  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, recipientId: userId },
    select: { id: true, itemId: true }
  });
  if (!inquiry) throw new ApiError(404, "INQUIRY_NOT_FOUND", "Pesan tidak ditemukan.");
  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.inquiry.update({
      where: { id: inquiry.id },
      data: { status: input.status },
      include: {
        item: { select: { id: true, title: true } },
        sender: { select: participantSelect },
        recipient: { select: participantSelect }
      }
    });
    await transaction.activityLog.create({
      data: {
        userId,
        itemId: inquiry.itemId,
        action: `Memperbarui status pesan menjadi ${input.status}`
      }
    });
    return result;
  });
  response.json({ data: updated });
});

domainRouter.get("/profile", requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({ where: { id: authenticatedUser(request).id } });
  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "Akun tidak ditemukan.");
  response.json({ data: userDto(user) });
});

domainRouter.put("/profile", requireAuth, async (request, response) => {
  const input = parseInput(z.object(profileFields).strict(), request.body);
  const userId = authenticatedUser(request).id;
  const user = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        ...(input.phone === undefined ? {} : { phone: input.phone }),
        ...(input.bio === undefined ? {} : { bio: input.bio }),
        avatarInitials: input.name.split(/\s+/).filter(Boolean).slice(0, 2)
          .map((part) => part[0]!.toUpperCase()).join("")
      }
    });
    await transaction.activityLog.create({ data: { userId, action: "Memperbarui profil" } });
    return updated;
  });
  response.json({ data: userDto(user) });
});

domainRouter.get("/activities", requireAuth, async (request, response) => {
  const query = parseInput(paginationSchema, request.query);
  const userId = authenticatedUser(request).id;
  const where = { userId };
  const [activities, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    }),
    prisma.activityLog.count({ where })
  ]);
  response.json({ data: activities, pagination: paginationDto(query.page, query.pageSize, total) });
});
