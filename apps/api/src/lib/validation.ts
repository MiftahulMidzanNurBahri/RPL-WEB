import { z } from "zod";
import { ApiError } from "./errors.js";

function sanitizeInput(value: unknown): unknown {
  if (typeof value === "string") {
    return value.trim() === "" ? undefined : value.trim();
  }

  if (Array.isArray(value)) {
    const sanitized = value.map((item) => sanitizeInput(item));
    return sanitized.filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .flatMap(([key, entry]) => {
          const sanitized = sanitizeInput(entry);
          return sanitized === undefined ? [] : [[key, sanitized]];
        })
    );
  }

  return value;
}

export function parseInput<Schema extends z.ZodTypeAny>(schema: Schema, input: unknown): z.output<Schema> {
  const sanitizedInput = sanitizeInput(input);
  const result = schema.safeParse(sanitizedInput);
  if (!result.success) {
    const fields = Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join(".") || "request", [issue.message]])
    );
    throw new ApiError(400, "VALIDATION_ERROR", "Periksa kembali data yang dikirim.", fields);
  }
  return result.data;
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
}).strict();