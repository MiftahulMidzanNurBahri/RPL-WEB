import { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE, hashSessionToken } from "../lib/sessions.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/errors.js";

async function loadAuth(request: Request): Promise<void> {
  const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) throw new ApiError(401, "AUTH_REQUIRED", "Silakan masuk untuk melanjutkan.");

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { id: true, userId: true, expiresAt: true, lastSeenAt: true, user: { select: { role: true } } }
  });

  if (!session || session.expiresAt <= new Date()) {
    throw new ApiError(401, "SESSION_EXPIRED", "Sesi berakhir. Silakan masuk kembali.");
  }

  request.authUser = { id: session.userId, role: session.user.role, sessionId: session.id };
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    await loadAuth(request);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  if (!request.cookies?.[SESSION_COOKIE]) {
    next();
    return;
  }

  try {
    await loadAuth(request);
    next();
  } catch (error) {
    next(error);
  }
}

export function authenticatedUser(request: Request): NonNullable<Request["authUser"]> {
  if (!request.authUser) throw new ApiError(401, "AUTH_REQUIRED", "Silakan masuk untuk melanjutkan.");
  return request.authUser;
}