import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const ReturnedItemRetentionDays = 3;
const RetentionMilliseconds = ReturnedItemRetentionDays * 24 * 60 * 60 * 1000;
type CleanupDatabase = Pick<PrismaClient, "$executeRaw">;

export function returnedItemCutoff(now = new Date()): Date {
  return new Date(now.getTime() - RetentionMilliseconds);
}

export async function cleanupExpiredReturnedItems(
  now = new Date(),
  database: CleanupDatabase = prisma
): Promise<number> {
  const cutoff = returnedItemCutoff(now).toISOString();
  return database.$executeRaw`
    DELETE FROM "Item"
    WHERE "status" = 'returned'
      AND julianday("updatedAt") <= julianday(${cutoff})
  `;
}