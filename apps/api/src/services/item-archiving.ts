import { prisma } from "../lib/prisma.js";

export const ReportRetentionDays = 14;
const RetentionMilliseconds = ReportRetentionDays * 24 * 60 * 60 * 1000;

export function reportExpirationDate(from = new Date()): Date {
  return new Date(from.getTime() + RetentionMilliseconds);
}

export async function archiveExpiredReports(now = new Date()): Promise<void> {
  await prisma.item.updateMany({
    where: {
      status: { in: ["lost", "found"] },
      archivedAt: null,
      deletedAt: null,
      expiresAt: { lte: now }
    },
    data: { archivedAt: now }
  });
}

export function activeReportWhere(now = new Date()) {
  return {
    status: { in: ["lost", "found"] },
    archivedAt: null,
    deletedAt: null,
    expiresAt: { gt: now }
  };
}