ALTER TABLE "Item" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "Item" ADD COLUMN "archivedAt" DATETIME;

UPDATE "Item"
SET "expiresAt" = datetime("createdAt", '+14 days')
WHERE "expiresAt" IS NULL;

UPDATE "Item"
SET "archivedAt" = CURRENT_TIMESTAMP
WHERE "status" IN ('lost', 'found')
  AND "deletedAt" IS NULL
  AND "expiresAt" <= CURRENT_TIMESTAMP;

CREATE INDEX "Item_archivedAt_expiresAt_idx" ON "Item"("archivedAt", "expiresAt");