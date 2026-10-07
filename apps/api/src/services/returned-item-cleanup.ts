import { prisma } from "../lib/prisma.js";

export const ReturnedItemRetentionDays = 3;
const RetentionMilliseconds = ReturnedItemRetentionDays * 24 * 60 * 60 * 1000;

export function returnedItemCutoff(now = new Date()): Date {
  return new Date(now.getTime() - RetentionMilliseconds);
}

export async function cleanupExpiredReturnedItems(now = new Date()): Promise<number> {
  const cutoff = returnedItemCutoff(now).toISOString();
  return prisma.$executeRaw`
    DELETE FROM "Item"
    WHERE "status" = 'returned'
      AND "deletedAt" IS NULL
      AND julianday("updatedAt") <= julianday(${cutoff})
  `;
}