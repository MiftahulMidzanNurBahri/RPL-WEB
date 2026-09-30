export const ItemCategories = [
  "Elektronik & Gadget",
  "KTM & Dompet",
  "Kunci Kendaraan",
  "Buku & Dokumen Kuliah",
  "Pakaian & Jaket Almamater",
  "Kacamata",
  "Lainnya"
] as const;

export const CampusLocations = [
  "Perpustakaan Pradita",
  "Laboratorium Komputer & Desain",
  "Ruang Kuliah Teori Lantai 2-5",
  "Student Lounge/Kantin Pradita",
  "Fasilitas Olahraga",
  "Area Parkir",
  "Lobby Utama"
] as const;

export const UserRoles = ["student", "faculty_staff", "campus_staff"] as const;
export const ReportTypes = ["lost", "found"] as const;
export const ItemStatuses = ["lost", "found", "returned"] as const;
export const InquiryKinds = ["inquiry", "claim"] as const;
export const InquiryStatuses = ["pending", "replied", "resolved"] as const;