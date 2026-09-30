import { z } from "zod";
import { ApiError } from "./errors.js";
import {
  CampusLocations,
  InquiryKinds,
  InquiryStatuses,
  ItemCategories,
  ItemStatuses,
  ReportTypes
} from "../../../../packages/shared/src/index.js";

export const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase());

export const profileFields = {
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(32).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional()
};

export const itemCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(ItemCategories),
  reportType: z.enum(ReportTypes),
  description: z.string().trim().min(1).max(3000),
  additionalInfo: z.string().trim().max(1000).nullable().optional(),
  location: z.enum(CampusLocations),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  incidentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional()
}).strict();

export const itemQuerySchema = z.object({
  q: z.string().trim().max(160).optional(),
  reportType: z.enum(ReportTypes).optional(),
  status: z.enum(ItemStatuses).optional(),
  category: z.enum(ItemCategories).optional(),
  location: z.enum(CampusLocations).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
}).strict();

export const inquiryCreateSchema = z.object({
  kind: z.enum(InquiryKinds).default("inquiry"),
  message: z.string().trim().min(1).max(2000)
}).strict();

export const inquiryUpdateSchema = z.object({
  status: z.enum(InquiryStatuses)
}).strict();

export function parseIncidentDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ApiError(400, "INVALID_DATE", "Tanggal kejadian tidak valid.", {
      incidentDate: ["Gunakan tanggal yang valid dengan format YYYY-MM-DD."]
    });
  }
  const tomorrow = new Date();
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (date >= tomorrow) {
    throw new ApiError(400, "INVALID_DATE", "Tanggal kejadian tidak boleh di masa depan.", {
      incidentDate: ["Pilih tanggal hari ini atau tanggal sebelumnya."]
    });
  }
  return date;
}