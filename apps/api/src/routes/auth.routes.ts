import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/errors.js";
import { parseInput } from "../lib/validation.js";
import { emailSchema } from "../lib/schemas.js";
import { clearSessionCookies, createSession } from "../lib/sessions.js";
import { authenticatedUser, requireAuth } from "../middleware/auth.js";
import { userDto } from "../lib/dto.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan. Coba kembali beberapa menit lagi.", fields: {} }
  }
});

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: z.string().min(12).max(128),
  studentNumber: z.string().trim().min(1).max(40).optional(),
  phone: z.string().trim().max(32).optional()
}).strict();

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128)
}).strict();

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join("");
}

authRouter.post("/register", authLimiter, async (request, response) => {
  const input = parseInput(registrationSchema, request.body);
  const role = input.email.endsWith("@student.pradita.ac.id")
    ? "student"
    : input.email.endsWith("@pradita.ac.id")
      ? "faculty_staff"
      : null;

  if (!role) {
    throw new ApiError(400, "INSTITUTION_EMAIL_REQUIRED", "Gunakan email resmi Universitas Pradita.", {
      email: ["Email harus berakhiran @student.pradita.ac.id atau @pradita.ac.id."]
    });
  }

  if (role === "faculty_staff" && input.studentNumber) {
    throw new ApiError(400, "INVALID_STUDENT_NUMBER", "Nomor mahasiswa hanya berlaku untuk akun mahasiswa.");
  }

  const passwordHash = await hash(input.password, 12);
  const user = await prisma.$transaction(async (transaction) => {
    const createdUser = await transaction.user.create({
      data: {
        name: input.name,
        email: input.email,
        studentNumber: role === "student" ? input.studentNumber : null,
        phone: input.phone,
        role,
        avatarInitials: initials(input.name),
        passwordHash
      }
    });
    await transaction.activityLog.create({
      data: { userId: createdUser.id, action: "Membuat akun Lost And Found" }
    });
    return createdUser;
  });

  await createSession(user, response);
  response.status(201).json({ data: userDto(user) });
});

authRouter.post("/login", authLimiter, async (request, response) => {
  const input = parseInput(loginSchema, request.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await compare(input.password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email atau kata sandi tidak sesuai.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  await createSession(updatedUser, response);
  response.json({ data: userDto(updatedUser) });
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const user = await prisma.user.findUnique({ where: { id: authenticatedUser(request).id } });
  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "Akun tidak ditemukan.");
  response.json({ data: userDto(user) });
});

authRouter.post("/logout", requireAuth, async (request, response) => {
  const currentUser = authenticatedUser(request);
  await prisma.session.delete({ where: { id: currentUser.sessionId } });
  clearSessionCookies(response);
  response.status(204).end();
});

authRouter.put("/password", requireAuth, async (request, response) => {
  const input = parseInput(z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128)
  }).strict(), request.body);
  const currentUser = authenticatedUser(request);
  const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
  if (!user || !(await compare(input.currentPassword, user.passwordHash))) {
    throw new ApiError(400, "CURRENT_PASSWORD_INVALID", "Kata sandi saat ini tidak sesuai.");
  }

  const passwordHash = await hash(input.newPassword, 12);
  const updatedUser = await prisma.$transaction(async (transaction) => {
    const result = await transaction.user.update({ where: { id: user.id }, data: { passwordHash } });
    await transaction.session.deleteMany({ where: { userId: user.id } });
    return result;
  });
  clearSessionCookies(response);
  await createSession(updatedUser, response);
  response.json({ data: userDto(updatedUser) });
});

