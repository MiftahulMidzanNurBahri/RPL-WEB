import { fileTypeFromBuffer } from "file-type";
import { Request, Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/errors.js";
import { itemDto, paginationDto } from "../lib/dto.js";
import {
  itemCreateSchema,
  itemQuerySchema,
  parseIncidentDate,
} from "../lib/schemas.js";
import { parseInput } from "../lib/validation.js";
import {
  authenticatedUser,
  optionalAuth,
  requireAuth,
} from "../middleware/auth.js";
import {
  activeReportWhere,
  archiveExpiredReports,
  reportExpirationDate,
} from "../services/item-archiving.js";
import { deleteItemImage, uploadItemImage } from "../lib/storage.js";
export const itemsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const reporterSelect = { id: true, name: true, avatarInitials: true } as const;
const operatingHoursMessage =
  "Waktu penyerahan/pertemuan harus antara 09:00 dan 19:00 WIB. Pilih waktu pada rentang tersebut atau jadwalkan penyerahan pada hari operasional kampus.";

function itemIdFrom(request: Request): string {
  const itemId = request.params.id;
  if (typeof itemId !== "string" || itemId.length > 100) {
    throw new ApiError(400, "INVALID_ITEM_ID", "ID laporan tidak valid.");
  }
  return itemId;
}

async function saveImage(
  file: Express.Multer.File | undefined,
): Promise<string | undefined> {
  if (!file) return undefined;

  const detected = await fileTypeFromBuffer(file.buffer);

  if (!detected || !imageMimeTypes.has(detected.mime)) {
    throw new ApiError(
      400,
      "INVALID_IMAGE",
      "Unggah gambar JPEG, PNG, atau WebP yang valid.",
    );
  }

  try {
    return await uploadItemImage(file.buffer, detected.mime, detected.ext);
  } catch (error) {
    console.error("Image upload failed:", error);
    throw new ApiError(
      500,
      "IMAGE_UPLOAD_FAILED",
      "Gagal mengunggah gambar. Silakan coba lagi.",
    );
  }
}

async function removeImage(imagePath: string | null): Promise<void> {
  if (!imagePath || imagePath.startsWith("uploads/")) return;

  await deleteItemImage(imagePath);
}
function incidentDate(input: string | null | undefined): Date | null {
  return input ? parseIncidentDate(input) : null;
}

itemsRouter.get("/", async (request, response) => {
  await archiveExpiredReports();
  const query = parseInput(itemQuerySchema, request.query);
  const now = new Date();
  const where = {
    AND: [
      activeReportWhere(now),
      {
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q } },
                { description: { contains: query.q } },
                { location: { contains: query.q } },
              ],
            }
          : {}),
        ...(query.reportType ? { reportType: query.reportType } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.location ? { location: query.location } : {}),
      },
    ],
  };
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      include: { reporter: { select: reporterSelect } },
      orderBy: { createdAt: query.sort === "newest" ? "desc" : "asc" },
      skip,
      take: query.pageSize,
    }),
    prisma.item.count({ where }),
  ]);

  response.json({
    data: items.map((item) => itemDto(item)),
    pagination: paginationDto(query.page, query.pageSize, total),
  });
});

itemsRouter.post(
  "/",
  requireAuth,
  upload.single("image"),
  async (request, response) => {
    const input = parseInput(itemCreateSchema, request.body);
    const currentUser = authenticatedUser(request);

    if (input.reportType === "found" && !request.file) {
      throw new ApiError(
        400,
        "IMAGE_REQUIRED",
        "Foto barang temuan wajib diunggah.",
      );
    }

    if (input.reportType === "found" && input.meetUpTime) {
      if (input.meetUpTime < "09:00" || input.meetUpTime > "19:00") {
        throw new ApiError(
          400,
          "OUTSIDE_OPERATING_HOURS",
          operatingHoursMessage,
        );
      }
    }

    const imagePath = await saveImage(request.file);

    try {
      const item = await prisma.$transaction(async (transaction) => {
        const createdItem = await transaction.item.create({
          data: {
            reporterId: currentUser.id,
            title: input.title,
            category:
              input.reportType === "lost" ? (input.category ?? null) : null,
            reportType: input.reportType,
            status: input.reportType,
            description: input.description,
            additionalInfo:
              input.reportType === "lost" ? input.additionalInfo || null : null,
            location:
              input.reportType === "lost" ? (input.location ?? null) : null,
            dropOffPoint:
              input.reportType === "found" ? input.dropOffPoint || null : null,
            incidentDate: incidentDate(input.incidentDate),
            incidentTime:
              input.reportType === "lost" ? input.incidentTime || null : null,
            meetUpTime:
              input.reportType === "found" ? input.meetUpTime || null : null,
            imagePath,
            expiresAt: reportExpirationDate(),
          },
          include: { reporter: { select: reporterSelect } },
        });
        await transaction.activityLog.create({
          data: {
            userId: currentUser.id,
            itemId: createdItem.id,
            action: `Melaporkan barang ${input.reportType}${input.location ? ` di ${input.location}` : ""}`,
          },
        });
        return createdItem;
      });

      response
        .status(201)
        .json({ data: itemDto(item, { isMine: true, includePrivate: true }) });
    } catch (error) {
      try {
        await removeImage(imagePath ?? null);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded image:", cleanupError);
      }

      throw error;
    }
  },
);

itemsRouter.get("/:id", optionalAuth, async (request, response) => {
  await archiveExpiredReports();
  const item = await prisma.item.findFirst({
    where: { id: itemIdFrom(request), deletedAt: null },
    include: { reporter: { select: reporterSelect } },
  });
  if (!item)
    throw new ApiError(
      404,
      "ITEM_NOT_FOUND",
      "Laporan barang tidak ditemukan.",
    );

  const isMine = request.authUser?.id === item.reporterId;
  if (item.archivedAt && !isMine)
    throw new ApiError(
      404,
      "ITEM_NOT_FOUND",
      "Laporan barang tidak ditemukan.",
    );
  response.json({
    data: itemDto(item, { isMine, includePrivate: isMine }),
  });
});

itemsRouter.put(
  "/:id",
  requireAuth,
  upload.single("image"),
  async (request, response) => {
    const input = parseInput(itemCreateSchema, request.body);
    const currentUser = authenticatedUser(request);
    const existingItem = await prisma.item.findFirst({
      where: {
        id: itemIdFrom(request),
        reporterId: currentUser.id,
        deletedAt: null,
      },
    });
    if (!existingItem)
      throw new ApiError(
        404,
        "ITEM_NOT_FOUND",
        "Laporan barang tidak ditemukan.",
      );
    if (existingItem.status === "returned") {
      throw new ApiError(
        409,
        "ITEM_ALREADY_RETURNED",
        "Laporan yang selesai tidak dapat diubah.",
      );
    }

    if (
      input.reportType === "found" &&
      !request.file &&
      !existingItem.imagePath
    ) {
      throw new ApiError(
        400,
        "IMAGE_REQUIRED",
        "Foto barang temuan wajib diunggah.",
      );
    }

    if (input.reportType === "found" && input.meetUpTime) {
      if (input.meetUpTime < "09:00" || input.meetUpTime > "19:00") {
        throw new ApiError(
          400,
          "OUTSIDE_OPERATING_HOURS",
          operatingHoursMessage,
        );
      }
    }

    const replacementImage = await saveImage(request.file);

    let item;

    try {
      item = await prisma.$transaction(async (transaction) => {
        const updatedItem = await transaction.item.update({
          where: { id: existingItem.id },
          data: {
            title: input.title,
            category:
              input.reportType === "lost" ? (input.category ?? null) : null,
            reportType: input.reportType,
            status: input.reportType,
            description: input.description,
            additionalInfo:
              input.reportType === "lost" ? input.additionalInfo || null : null,
            location:
              input.reportType === "lost" ? (input.location ?? null) : null,
            dropOffPoint:
              input.reportType === "found" ? input.dropOffPoint || null : null,
            incidentDate: incidentDate(input.incidentDate),
            incidentTime:
              input.reportType === "lost" ? input.incidentTime || null : null,
            meetUpTime:
              input.reportType === "found" ? input.meetUpTime || null : null,
            ...(replacementImage ? { imagePath: replacementImage } : {}),
          },
          include: { reporter: { select: reporterSelect } },
        });

        await transaction.activityLog.create({
          data: {
            userId: currentUser.id,
            itemId: updatedItem.id,
            action: "Memperbarui laporan barang",
          },
        });

        return updatedItem;
      });
    } catch (error) {
      if (replacementImage) {
        try {
          await removeImage(replacementImage);
        } catch (cleanupError) {
          console.error("Failed to clean up replacement image:", cleanupError);
        }
      }

      throw error;
    }

    // Hapus gambar lama setelah database berhasil diperbarui.
    if (replacementImage) {
      try {
        await removeImage(existingItem.imagePath);
      } catch (cleanupError) {
        console.error("Failed to delete previous image:", cleanupError);
      }
    }

    response.json({
      data: itemDto(item, { isMine: true, includePrivate: true }),
    });
  },
);

itemsRouter.post("/:id/renew", requireAuth, async (request, response) => {
  const currentUser = authenticatedUser(request);
  const itemId = itemIdFrom(request);
  const now = new Date();
  const result = await prisma.$transaction(async (transaction) => {
    const renewed = await transaction.item.updateMany({
      where: {
        id: itemId,
        reporterId: currentUser.id,
        status: { in: ["lost", "found"] },
        deletedAt: null,
      },
      data: { archivedAt: null, expiresAt: reportExpirationDate(now) },
    });
    if (renewed.count === 0) {
      const existing = await transaction.item.findFirst({
        where: { id: itemId, reporterId: currentUser.id, deletedAt: null },
        select: { id: true },
      });
      if (!existing)
        throw new ApiError(
          404,
          "ITEM_NOT_FOUND",
          "Laporan barang tidak ditemukan.",
        );
      throw new ApiError(
        409,
        "ITEM_NOT_RENEWABLE",
        "Laporan yang sudah dikembalikan tidak dapat diperpanjang.",
      );
    }
    const item = await transaction.item.findUniqueOrThrow({
      where: { id: itemId },
      include: { reporter: { select: reporterSelect } },
    });
    await transaction.activityLog.create({
      data: {
        userId: currentUser.id,
        itemId,
        action: "Memperpanjang masa aktif laporan selama 14 hari",
      },
    });
    return item;
  });
  response.json({
    data: itemDto(result, { isMine: true, includePrivate: true }),
  });
});

itemsRouter.delete("/:id", requireAuth, async (request, response) => {
  const currentUser = authenticatedUser(request);
  const item = await prisma.item.findFirst({
    where: {
      id: itemIdFrom(request),
      reporterId: currentUser.id,
      deletedAt: null,
    },
  });
  if (!item)
    throw new ApiError(
      404,
      "ITEM_NOT_FOUND",
      "Laporan barang tidak ditemukan.",
    );

  await prisma.$transaction([
    prisma.item.update({
      where: { id: item.id },
      data: { deletedAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        itemId: item.id,
        action: "Menghapus laporan barang",
      },
    }),
  ]);
  response.status(204).end();
});

itemsRouter.post("/:id/return", requireAuth, async (request, response) => {
  const currentUser = authenticatedUser(request);
  const itemId = itemIdFrom(request);
  const returnedAt = new Date();
  const updatedItem = await prisma.$transaction(async (transaction) => {
    const result = await transaction.item.updateMany({
      where: {
        id: itemId,
        reporterId: currentUser.id,
        status: { in: ["lost", "found"] },
        deletedAt: null,
      },
      data: { status: "returned", returnedAt, archivedAt: null },
    });
    if (result.count === 0) {
      const existing = await transaction.item.findFirst({
        where: { id: itemId, reporterId: currentUser.id, deletedAt: null },
        select: { id: true },
      });
      if (!existing)
        throw new ApiError(
          404,
          "ITEM_NOT_FOUND",
          "Laporan barang tidak ditemukan.",
        );
      throw new ApiError(
        409,
        "ITEM_ALREADY_RETURNED",
        "Barang sudah ditandai selesai.",
      );
    }
    const item = await transaction.item.findUniqueOrThrow({
      where: { id: itemId },
      include: { reporter: { select: reporterSelect } },
    });
    await transaction.activityLog.create({
      data: {
        userId: currentUser.id,
        itemId,
        action: "Menandai barang telah dikembalikan",
      },
    });
    return item;
  });
  response.json({
    data: itemDto(updatedItem, { isMine: true, includePrivate: true }),
  });
});
