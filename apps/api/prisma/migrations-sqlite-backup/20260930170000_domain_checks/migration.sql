CREATE TRIGGER "User_domain_check_insert"
BEFORE INSERT ON "User"
WHEN
  NEW."email" != lower(NEW."email")
  OR (NEW."role" = 'student' AND NEW."email" NOT LIKE '%@student.pradita.ac.id')
  OR (NEW."role" IN ('faculty_staff', 'campus_staff') AND NEW."email" NOT LIKE '%@pradita.ac.id')
  OR NEW."role" NOT IN ('student', 'faculty_staff', 'campus_staff')
BEGIN
  SELECT RAISE(ABORT, 'Invalid user email or role');
END;

CREATE TRIGGER "User_domain_check_update"
BEFORE UPDATE OF "email", "role" ON "User"
WHEN
  NEW."email" != lower(NEW."email")
  OR (NEW."role" = 'student' AND NEW."email" NOT LIKE '%@student.pradita.ac.id')
  OR (NEW."role" IN ('faculty_staff', 'campus_staff') AND NEW."email" NOT LIKE '%@pradita.ac.id')
  OR NEW."role" NOT IN ('student', 'faculty_staff', 'campus_staff')
BEGIN
  SELECT RAISE(ABORT, 'Invalid user email or role');
END;

CREATE TRIGGER "Item_domain_check_insert"
BEFORE INSERT ON "Item"
WHEN
  NEW."category" NOT IN (
    'Elektronik & Gadget',
    'KTM & Dompet',
    'Kunci Kendaraan',
    'Buku & Dokumen Kuliah',
    'Pakaian & Jaket Almamater',
    'Kacamata',
    'Lainnya'
  )
  OR NEW."location" NOT IN (
    'Perpustakaan Pradita',
    'Laboratorium Komputer & Desain',
    'Ruang Kuliah Teori Lantai 2-5',
    'Student Lounge/Kantin Pradita',
    'Fasilitas Olahraga',
    'Area Parkir',
    'Lobby Utama'
  )
  OR NEW."reportType" NOT IN ('lost', 'found')
  OR NEW."status" NOT IN ('lost', 'found', 'returned')
  OR (NEW."status" != 'returned' AND NEW."status" != NEW."reportType")
  OR (NEW."status" = 'returned' AND NEW."returnedAt" IS NULL)
  OR (NEW."status" != 'returned' AND NEW."returnedAt" IS NOT NULL)
BEGIN
  SELECT RAISE(ABORT, 'Invalid item category, location, or lifecycle state');
END;

CREATE TRIGGER "Item_domain_check_update"
BEFORE UPDATE OF "category", "location", "reportType", "status", "returnedAt" ON "Item"
WHEN
  NEW."category" NOT IN (
    'Elektronik & Gadget',
    'KTM & Dompet',
    'Kunci Kendaraan',
    'Buku & Dokumen Kuliah',
    'Pakaian & Jaket Almamater',
    'Kacamata',
    'Lainnya'
  )
  OR NEW."location" NOT IN (
    'Perpustakaan Pradita',
    'Laboratorium Komputer & Desain',
    'Ruang Kuliah Teori Lantai 2-5',
    'Student Lounge/Kantin Pradita',
    'Fasilitas Olahraga',
    'Area Parkir',
    'Lobby Utama'
  )
  OR NEW."reportType" NOT IN ('lost', 'found')
  OR NEW."status" NOT IN ('lost', 'found', 'returned')
  OR (NEW."status" != 'returned' AND NEW."status" != NEW."reportType")
  OR (NEW."status" = 'returned' AND NEW."returnedAt" IS NULL)
  OR (NEW."status" != 'returned' AND NEW."returnedAt" IS NOT NULL)
BEGIN
  SELECT RAISE(ABORT, 'Invalid item category, location, or lifecycle state');
END;

CREATE TRIGGER "Inquiry_domain_check_insert"
BEFORE INSERT ON "Inquiry"
WHEN
  NEW."kind" NOT IN ('inquiry', 'claim')
  OR NEW."status" NOT IN ('pending', 'replied', 'resolved')
BEGIN
  SELECT RAISE(ABORT, 'Invalid inquiry kind or status');
END;

CREATE TRIGGER "Inquiry_domain_check_update"
BEFORE UPDATE OF "kind", "status" ON "Inquiry"
WHEN
  NEW."kind" NOT IN ('inquiry', 'claim')
  OR NEW."status" NOT IN ('pending', 'replied', 'resolved')
BEGIN
  SELECT RAISE(ABORT, 'Invalid inquiry kind or status');
END;