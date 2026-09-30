import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    response.status(status).json({
      error: {
        code: error.code,
        message: status === 413 ? "Ukuran gambar maksimal 5 MB." : "Data unggahan tidak valid.",
        fields: { image: [error.message] }
      }
    });
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message, fields: error.fields ?? {} }
    });
    return;
  }

  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join(".") || "request", [issue.message]])
    );
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Periksa kembali data yang dikirim.", fields }
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    response.status(409).json({
      error: {
        code: "DUPLICATE_VALUE",
        message: "Email atau nomor identitas tersebut sudah digunakan.",
        fields: {}
      }
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    response.status(404).json({
      error: { code: "NOT_FOUND", message: "Data tidak ditemukan.", fields: {} }
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    response.status(409).json({
      error: { code: "RELATED_DATA_EXISTS", message: "Data masih digunakan oleh catatan lain.", fields: {} }
    });
    return;
  }

  console.error("Unhandled API error", error instanceof Error ? error.name : "UnknownError");
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server.", fields: {} }
  });
};