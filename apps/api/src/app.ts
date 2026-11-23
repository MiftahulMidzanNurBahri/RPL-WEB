import "./config/env.js";
import { resolve } from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { authRouter } from "./routes/auth.routes.js";
import { domainRouter } from "./routes/domain.routes.js";
import { itemsRouter } from "./routes/items.routes.js";
import { errorHandler, ApiError } from "./lib/errors.js";
import { projectRoot } from "./lib/paths.js";
import { prisma } from "./lib/prisma.js";
import { verifyRequestOrigin, isAllowedOrigin } from "./middleware/security.js";
import { cleanupExpiredReturnedItems } from "./services/returned-item-cleanup.js";

const app = express();

app.disable("x-powered-by");
// Set this before parsers, security checks and rate limiters can return early.
app.use(["/api/auth", "/api/profile"], (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});
const helmetFn: any = helmet;
app.use(helmetFn({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(verifyRequestOrigin);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.use(
  "/uploads",
  express.static(resolve(projectRoot, process.env.UPLOAD_DIR ?? "uploads"), {
    dotfiles: "deny",
    index: false,
    immutable: true,
    maxAge: "1d",
  }),
);

app.get("/", (_request, response) => {
  response.json({ data: { status: "ok", service: "Lost and Found API" } });
});
app.get(["/health", "/api/health"], async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ data: { status: "ok" } });
});
app.use("/api", (request, _response, next) => {
  if (request.method !== "GET") {
    next();
    return;
  }
  void cleanupExpiredReturnedItems().then(() => next(), next);
});
app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api", domainRouter);
app.use("/api", (_request, _response, next) => {
  next(new ApiError(404, "ROUTE_NOT_FOUND", "Rute API tidak ditemukan."));
});
app.use(errorHandler);

export { app };
export default app;
