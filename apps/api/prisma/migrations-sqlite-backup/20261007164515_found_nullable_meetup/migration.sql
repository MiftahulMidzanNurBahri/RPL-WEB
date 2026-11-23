-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "reportType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "additionalInfo" TEXT,
    "location" TEXT,
    "dropOffPoint" TEXT,
    "incidentDate" DATETIME,
    "incidentTime" TEXT,
    "meetUpTime" TEXT,
    "imagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "returnedAt" DATETIME,
    "deletedAt" DATETIME,
    CONSTRAINT "Item_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("additionalInfo", "category", "createdAt", "deletedAt", "description", "dropOffPoint", "id", "imagePath", "incidentDate", "incidentTime", "location", "reportType", "reporterId", "returnedAt", "status", "title", "updatedAt") SELECT "additionalInfo", "category", "createdAt", "deletedAt", "description", "dropOffPoint", "id", "imagePath", "incidentDate", "incidentTime", "location", "reportType", "reporterId", "returnedAt", "status", "title", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_status_reportType_createdAt_idx" ON "Item"("status", "reportType", "createdAt");
CREATE INDEX "Item_category_location_idx" ON "Item"("category", "location");
CREATE INDEX "Item_reporterId_status_idx" ON "Item"("reporterId", "status");
CREATE INDEX "Item_deletedAt_createdAt_idx" ON "Item"("deletedAt", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE TRIGGER "Item_domain_check_insert"
BEFORE INSERT ON "Item"
WHEN
    (NEW."category" IS NOT NULL AND NEW."category" NOT IN (
        'Elektronik & Gadget', 'KTM & Dompet', 'Kunci Kendaraan', 'Buku & Dokumen Kuliah',
        'Pakaian & Jaket Almamater', 'Kacamata', 'Lainnya'
    ))
    OR (NEW."location" IS NOT NULL AND NEW."location" NOT IN (
        'Perpustakaan Pradita', 'Laboratorium Komputer & Desain', 'Ruang Kuliah Teori Lantai 2-5',
        'Student Lounge/Kantin Pradita', 'Fasilitas Olahraga', 'Area Parkir', 'Lobby Utama'
    ))
    OR (NEW."reportType" = 'lost' AND (NEW."category" IS NULL OR NEW."location" IS NULL OR NEW."incidentDate" IS NULL))
    OR NEW."reportType" NOT IN ('lost', 'found')
    OR NEW."status" NOT IN ('lost', 'found', 'returned')
    OR (NEW."status" != 'returned' AND NEW."status" != NEW."reportType")
    OR (NEW."status" = 'returned' AND NEW."returnedAt" IS NULL)
    OR (NEW."status" != 'returned' AND NEW."returnedAt" IS NOT NULL)
    OR (NEW."dropOffPoint" IS NOT NULL AND (
        NEW."reportType" != 'found'
        OR NEW."dropOffPoint" NOT IN ('Student Lounge Gedung A Lantai 2', 'Pos Satpam Gedung A & Gedung B')
    ))
    OR (NEW."meetUpTime" IS NOT NULL AND (
        NEW."reportType" != 'found'
        OR NEW."meetUpTime" NOT GLOB '[0-2][0-9]:[0-5][0-9]'
        OR substr(NEW."meetUpTime", 1, 2) > '23'
        OR NEW."meetUpTime" < '09:00'
        OR NEW."meetUpTime" > '19:00'
    ))
BEGIN
    SELECT RAISE(ABORT, 'Invalid item details or lifecycle state');
END;

CREATE TRIGGER "Item_domain_check_update"
BEFORE UPDATE OF "category", "location", "incidentDate", "dropOffPoint", "meetUpTime", "reportType", "status", "returnedAt" ON "Item"
WHEN
    (NEW."category" IS NOT NULL AND NEW."category" NOT IN (
        'Elektronik & Gadget', 'KTM & Dompet', 'Kunci Kendaraan', 'Buku & Dokumen Kuliah',
        'Pakaian & Jaket Almamater', 'Kacamata', 'Lainnya'
    ))
    OR (NEW."location" IS NOT NULL AND NEW."location" NOT IN (
        'Perpustakaan Pradita', 'Laboratorium Komputer & Desain', 'Ruang Kuliah Teori Lantai 2-5',
        'Student Lounge/Kantin Pradita', 'Fasilitas Olahraga', 'Area Parkir', 'Lobby Utama'
    ))
    OR (NEW."reportType" = 'lost' AND (NEW."category" IS NULL OR NEW."location" IS NULL OR NEW."incidentDate" IS NULL))
    OR NEW."reportType" NOT IN ('lost', 'found')
    OR NEW."status" NOT IN ('lost', 'found', 'returned')
    OR (NEW."status" != 'returned' AND NEW."status" != NEW."reportType")
    OR (NEW."status" = 'returned' AND NEW."returnedAt" IS NULL)
    OR (NEW."status" != 'returned' AND NEW."returnedAt" IS NOT NULL)
    OR (NEW."dropOffPoint" IS NOT NULL AND (
        NEW."reportType" != 'found'
        OR NEW."dropOffPoint" NOT IN ('Student Lounge Gedung A Lantai 2', 'Pos Satpam Gedung A & Gedung B')
    ))
    OR (NEW."meetUpTime" IS NOT NULL AND (
        NEW."reportType" != 'found'
        OR NEW."meetUpTime" NOT GLOB '[0-2][0-9]:[0-5][0-9]'
        OR substr(NEW."meetUpTime", 1, 2) > '23'
        OR NEW."meetUpTime" < '09:00'
        OR NEW."meetUpTime" > '19:00'
    ))
BEGIN
    SELECT RAISE(ABORT, 'Invalid item details or lifecycle state');
END;
