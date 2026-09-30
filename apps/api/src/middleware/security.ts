import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors.js";
import { CSRF_COOKIE, verifyCsrfToken } from "../lib/sessions.js";

const MutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function verifyRequestOrigin(request: Request, _response: Response, next: NextFunction): void {
  if (!MutatingMethods.has(request.method)) {
    next();
    return;
  }

  const allowedOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
  if (request.get("origin") !== allowedOrigin) {
    next(new ApiError(403, "INVALID_ORIGIN", "Permintaan berasal dari origin yang tidak diizinkan."));
    return;
  }

  const sessionCookieName = process.env.NODE_ENV === "production" ? "__Host-laf_session" : "laf_session";
  if (request.cookies?.[sessionCookieName]) {
    const signedCsrf = request.cookies[CSRF_COOKIE];
    const headerCsrf = request.get("x-csrf-token");
    if (!verifyCsrfToken(signedCsrf, headerCsrf)) {
      next(new ApiError(403, "CSRF_INVALID", "Token keamanan permintaan tidak valid."));
      return;
    }
  }

  next();
}