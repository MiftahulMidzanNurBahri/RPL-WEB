DROP TRIGGER IF EXISTS "Item_domain_check_insert";
DROP TRIGGER IF EXISTS "Item_domain_check_update";

CREATE TRIGGER "Item_domain_check_insert"
BEFORE INSERT ON "Item"
WHEN
    (NEW."category" IS NOT NULL AND NEW."category" NOT IN (
        'Elektronik & Gadget', 'KTM & Dompet', 'Kunci Kendaraan', 'Buku & Dokumen Kuliah',
        'Pakaian & Jaket Almamater', 'Kacamata', 'Lainnya'
    ))
    OR (NEW."location" IS NOT NULL AND (length(trim(NEW."location")) = 0 OR length(NEW."location") > 250))
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
    OR (NEW."location" IS NOT NULL AND (length(trim(NEW."location")) = 0 OR length(NEW."location") > 250))
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