import { z } from "zod";
import { ApiError } from "./errors.js";

export function parseInput<Schema extends z.ZodTypeAny>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
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