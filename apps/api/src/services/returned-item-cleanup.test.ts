import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { cleanupExpiredReturnedItems, returnedItemCutoff } from "./returned-item-cleanup.js";

const now = new Date("2026-10-08T12:00:00.000Z");
const dayMilliseconds = 24 * 60 * 60 * 1000;

test("uses a three-day retention cutoff", () => {
  assert.equal(
    returnedItemCutoff(now).toISOString(),
    "2026-10-05T12:00:00.000Z"
  );
});

test("purges only expired returned items and preserves related history", async () => {
  const directory = await mkdtemp(join(tmpdir(), "lost-and-found-cleanup-"));
  const databasePath = join(directory, "cleanup.db").replaceAll("\\", "/");
  const database = new PrismaClient({ datasources: { db: { url: `file:${databasePath}` } } });

  try {
    await database.$executeRawUnsafe("PRAGMA foreign_keys = ON");
    await database.$executeRawUnsafe(`
      CREATE TABLE "Item" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "status" TEXT NOT NULL,
        "updatedAt" DATETIME NOT NULL,
        "deletedAt" DATETIME
      )
    `);
    await database.$executeRawUnsafe(`
      CREATE TABLE "ActivityLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "itemId" TEXT,
        "action" TEXT NOT NULL,
        FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL
      )
    `);
    await database.$executeRawUnsafe(`
      CREATE TABLE "Inquiry" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "itemId" TEXT,
        "message" TEXT NOT NULL,
        FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL
      )
    `);

    const expired = new Date(now.getTime() - 4 * dayMilliseconds).toISOString();
    const cutoff = returnedItemCutoff(now).toISOString();
    const recent = new Date(now.getTime() - 2 * dayMilliseconds).toISOString();
    const itemRows = [
      ["returned-old", "returned", expired, null],
      ["returned-boundary", "returned", cutoff, null],
      ["returned-recent", "returned", recent, null],
      ["lost-old", "lost", expired, null],
      ["found-old", "found", expired, null],
      ["returned-soft-deleted", "returned", expired, expired]
    ] as const;

    for (const [id, status, updatedAt, deletedAt] of itemRows) {
      await database.$executeRaw`
        INSERT INTO "Item" ("id", "status", "updatedAt", "deletedAt")
        VALUES (${id}, ${status}, ${updatedAt}, ${deletedAt})
      `;
    }

    await database.$executeRaw`
      INSERT INTO "ActivityLog" ("id", "itemId", "action")
      VALUES ('cleanup-log', 'returned-old', 'Item dikembalikan')
    `;
    await database.$executeRaw`
      INSERT INTO "Inquiry" ("id", "itemId", "message")
      VALUES ('cleanup-inquiry', 'returned-old', 'Pesan audit')
    `;

    const deletedCount = await cleanupExpiredReturnedItems(now, database);
    const remainingItems = await database.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Item" ORDER BY "id"
    `;
    const activity = await database.$queryRaw<Array<{ itemId: string | null; action: string }>>`
      SELECT "itemId", "action" FROM "ActivityLog" WHERE "id" = 'cleanup-log'
    `;
    const inquiry = await database.$queryRaw<Array<{ itemId: string | null; message: string }>>`
      SELECT "itemId", "message" FROM "Inquiry" WHERE "id" = 'cleanup-inquiry'
    `;

    assert.equal(deletedCount, 3);
    assert.deepEqual(remainingItems.map((item) => item.id), ["found-old", "lost-old", "returned-recent"]);
    assert.deepEqual(activity, [{ itemId: null, action: "Item dikembalikan" }]);
    assert.deepEqual(inquiry, [{ itemId: null, message: "Pesan audit" }]);
  } finally {
    await database.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});