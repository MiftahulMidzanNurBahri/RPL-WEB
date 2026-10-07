import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors.js";
import { CSRF_COOKIE, verifyCsrfToken } from "../lib/sessions.js";

const MutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SessionBootstrapPaths = new Set(["/api/auth/login", "/api/auth/register"]);

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, "");
  const configured = (process.env.WEB_ORIGIN ?? "http://localhost:5173").replace(/\/$/, "");
  if (normalized === configured) return true;
  if (process.env.NODE_ENV !== "production") {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized);
  }
  return false;
}

export function verifyRequestOrigin(request: Request, _response: Response, next: NextFunction): void {
  if (!MutatingMethods.has(request.method)) {
    next();
    return;
  }

  const origin = request.get("origin");
  if (!origin || !isAllowedOrigin(origin)) {
    next(new ApiError(403, "INVALID_ORIGIN", "Permintaan berasal dari origin yang tidak diizinkan."));
    return;
  }

  const sessionCookieName = process.env.NODE_ENV === "production" ? "__Host-laf_session" : "laf_session";
  const isSessionBootstrap = request.method === "POST" && SessionBootstrapPaths.has(request.path);
  if (request.cookies?.[sessionCookieName] && !isSessionBootstrap) {
    const signedCsrf = request.cookies[CSRF_COOKIE];
    const headerCsrf = request.get("x-csrf-token");
    if (!verifyCsrfToken(signedCsrf, headerCsrf)) {
      next(new ApiError(403, "CSRF_INVALID", "Token keamanan permintaan tidak valid."));
      return;
    }
  }

  next();
}