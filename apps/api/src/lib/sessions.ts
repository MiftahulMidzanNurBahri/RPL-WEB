import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CookieOptions, Response } from "express";
import type { User } from "@prisma/client";
import { prisma } from "./prisma.js";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-laf_session" : "laf_session";
export const CSRF_COOKIE = process.env.NODE_ENV === "production" ? "__Host-laf_csrf" : "laf_csrf";
const SessionDurationMs = 7 * 24 * 60 * 60 * 1000;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function cookieOptions(httpOnly: boolean, maxAge?: number): CookieOptions {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge })
  };
}

function signCsrfToken(token: string): string {
  const signature = createHmac("sha256", sessionSecret()).update(token).digest("base64url");
  return `${token}.${signature}`;
}

export function verifyCsrfToken(signedToken: string | undefined, headerToken: string | undefined): boolean {
  if (!signedToken || !headerToken) return false;
  const separator = signedToken.lastIndexOf(".");
  if (separator < 1) return false;
  const token = signedToken.slice(0, separator);
  const signature = signedToken.slice(separator + 1);
  const expected = createHmac("sha256", sessionSecret()).update(token).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return token === headerToken
    && actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function createSession(user: User, response: Response): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SessionDurationMs);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt
    }
  });

  response.cookie(SESSION_COOKIE, token, cookieOptions(true, SessionDurationMs));
  response.cookie(CSRF_COOKIE, signCsrfToken(csrfToken), cookieOptions(false, SessionDurationMs));
}

export function clearSessionCookies(response: Response): void {
  response.clearCookie(SESSION_COOKIE, cookieOptions(true));
  response.clearCookie(CSRF_COOKIE, cookieOptions(false));
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}