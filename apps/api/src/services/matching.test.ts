import assert from "node:assert/strict";
import test from "node:test";
import { scoreMatch } from "./matching.js";

// 1 - 10: Basic Scoring and Reasons
test("[MAT-01] awards category match bonus of 40 points", () => {
  const result = scoreMatch(
    { title: "KTM Mahasiswa", description: "Hilang", category: "Dokumen", location: null },
    { title: "Kartu Pelajar", description: "Ditemukan", category: "Dokumen", location: null }
  );
  assert.equal(result.score, 40);
  assert.deepEqual(result.reasons, ["Kategori barang sama"]);
});

test("[MAT-02] awards location match bonus of 25 points", () => {
  const result = scoreMatch(
    { title: "Pensil", description: "Hilang", category: null, location: "Perpustakaan Pradita" },
    { title: "Kacamata", description: "Ditemukan", category: null, location: "Perpustakaan Pradita" }
  );
  assert.equal(result.score, 25);
  assert.deepEqual(result.reasons, ["Lokasi kampus sama"]);
});

test("[MAT-03] awards both category and location points totaling 65 points", () => {
  const result = scoreMatch(
    { title: "Item A", description: "Hilang", category: "Elektronik", location: "Lobby Utama" },
    { title: "Item B", description: "Ditemukan", category: "Elektronik", location: "Lobby Utama" }
  );
  assert.equal(result.score, 65);
  assert.deepEqual(result.reasons, ["Kategori barang sama", "Lokasi kampus sama"]);
});

test("[MAT-04] awards 20 points for 1 or 2 matching keyword tokens", () => {
  const result = scoreMatch(
    { title: "Kalkulator Casio", description: "Hilang di meja", category: null, location: null },
    { title: "Kalkulator Scientific", description: "Ditemukan", category: null, location: null }
  );
  assert.equal(result.score, 20);
  assert.ok(result.reasons.includes("Kata kunci barang cocok"));
});

test("[MAT-05] awards 40 points for 3 or more matching keyword tokens", () => {
  const result = scoreMatch(
    { title: "Laptop Asus Vivobook OLED", description: "Warna perak", category: null, location: null },
    { title: "Laptop Asus Vivobook OLED", description: "Ditemukan di lab", category: null, location: null }
  );
  assert.equal(result.score, 40);
  assert.ok(result.reasons.includes("Kata kunci barang cocok"));
});

test("[MAT-06] awards maximum score of 105 for category, location, and >=3 keywords", () => {
  const result = scoreMatch(
    {
      title: "Laptop ASUS Vivobook",
      description: "Ditemukan dekat ruang baca",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    },
    {
      title: "Laptop ASUS Vivobook",
      description: "Hilang dekat ruang baca",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    }
  );
  assert.equal(result.score, 105);
  assert.equal(result.hasIdentityEvidence, true);
  assert.deepEqual(result.reasons, [
    "Kategori barang sama",
    "Kata kunci barang cocok",
    "Lokasi kampus sama"
  ]);
});

test("[MAT-07] returns zero score for completely unrelated reports", () => {
  const result = scoreMatch(
    { title: "Kunci motor Honda", description: "Gantungan biru", category: "Kunci", location: "Parkiran" },
    { title: "Buku Kalkulus", description: "Sampul merah", category: "Buku", location: "Kantin" }
  );
  assert.equal(result.score, 0);
  assert.equal(result.hasIdentityEvidence, false);
  assert.deepEqual(result.reasons, []);
});

test("[MAT-08] handles case-insensitive category matching", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: "Elektronik & Gadget", location: null },
    { title: "Barang Dua", description: "Temuan", category: "Elektronik & Gadget", location: null }
  );
  assert.equal(result.score, 40);
});

test("[MAT-09] handles case-insensitive location matching", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "LAB KOMPUTER 3" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "lab komputer 3" }
  );
  assert.equal(result.score, 25);
  assert.deepEqual(result.reasons, ["Lokasi kampus sama"]);
});

test("[MAT-10] matches free-form locations despite punctuation and hyphens", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "Lab Komputer, Lantai 3 - Ruang 14" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "lab komputer lantai 3 ruang 14" }
  );
  assert.equal(result.score, 25);
});

// 11 - 20: Location Normalization and Boundaries
test("[MAT-11] trims excess whitespace from locations during matching", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "   Student Lounge   " },
    { title: "Barang Dua", description: "Temuan", category: null, location: "Student Lounge" }
  );
  assert.equal(result.score, 25);
});

test("[MAT-12] does not match locations with different room numbers", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "Lab Komputer Ruang 301" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "Lab Komputer Ruang 302" }
  );
  assert.equal(result.score, 0);
});

test("[MAT-13] does not match locations with different floor numbers", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "Gedung A Lantai 1" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "Gedung A Lantai 2" }
  );
  assert.equal(result.score, 0);
});

test("[MAT-14] does not award location points when source location is empty", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "Kantin" }
  );
  assert.equal(result.score, 0);
});

test("[MAT-15] does not award location points when both locations are empty", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "" }
  );
  assert.equal(result.score, 0);
});

test("[MAT-16] does not award location points when location is whitespace only", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "   " },
    { title: "Barang Dua", description: "Temuan", category: null, location: "   " }
  );
  assert.equal(result.score, 0);
});

test("[MAT-17] does not award location points when location is null", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: null },
    { title: "Barang Dua", description: "Temuan", category: null, location: null }
  );
  assert.equal(result.score, 0);
});

test("[MAT-18] normalizes non-alphanumeric characters like parentheses and slashes in location", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "Gedung B (Lantai 2)" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "Gedung B / Lantai 2" }
  );
  assert.equal(result.score, 25);
});

test("[MAT-19] does not falsely match partial location tokens within longer words", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "Area Parkiran" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "Area Parkir" }
  );
  assert.equal(result.score, 0);
});

test("[MAT-20] matches identical campus locations from predefined drop-off points", () => {
  const result = scoreMatch(
    { title: "Barang Satu", description: "Laporan", category: null, location: "Student Lounge Gedung A Lantai 2" },
    { title: "Barang Dua", description: "Temuan", category: null, location: "Student Lounge Gedung A Lantai 2" }
  );
  assert.equal(result.score, 25);
});

// 21 - 30: Identity Evidence and Keyword Tokenization
test("[MAT-21] sets hasIdentityEvidence true when shared token appears in source title", () => {
  const result = scoreMatch(
    { title: "Tumbler Hydroflask Hitam", description: "Tertinggal", category: null, location: null },
    { title: "Botol Minum", description: "Ditemukan Hydroflask", category: null, location: null }
  );
  assert.equal(result.hasIdentityEvidence, true);
});

test("[MAT-22] sets hasIdentityEvidence true when shared token appears in candidate title", () => {
  const result = scoreMatch(
    { title: "Botol Minum", description: "Hilang Hydroflask", category: null, location: null },
    { title: "Tumbler Hydroflask Hitam", description: "Ditemukan", category: null, location: null }
  );
  assert.equal(result.hasIdentityEvidence, true);
});

test("[MAT-23] does not set hasIdentityEvidence true when shared words are only in descriptions", () => {
  const result = scoreMatch(
    { title: "Barang A", description: "Ada stiker unicorn", category: null, location: null },
    { title: "Barang B", description: "Tertempel stiker unicorn", category: null, location: null }
  );
  assert.equal(result.hasIdentityEvidence, false);
});

test("[MAT-24] category alone does not produce identity evidence", () => {
  const result = scoreMatch(
    { title: "KTM", description: "Hilang", category: "Elektronik & Gadget", location: null },
    { title: "Laptop", description: "Ditemukan", category: "Elektronik & Gadget", location: null }
  );
  assert.equal(result.hasIdentityEvidence, false);
  assert.equal(result.score, 40);
});

test("[MAT-25] location alone does not produce identity evidence", () => {
  const result = scoreMatch(
    { title: "Jaket", description: "Hilang", category: null, location: "Kantin" },
    { title: "Payung", description: "Ditemukan", category: null, location: "Kantin" }
  );
  assert.equal(result.hasIdentityEvidence, false);
  assert.equal(result.score, 25);
});

test("[MAT-26] ignores Indonesian stop words such as 'dan', 'yang', 'untuk', 'dari'", () => {
  const result = scoreMatch(
    { title: "Barang yang hilang untuk saya", description: "Dari teman", category: null, location: null },
    { title: "Barang yang ditemukan untuk kamu", description: "Dari meja", category: null, location: null }
  );
  assert.equal(result.score, 0);
  assert.equal(result.hasIdentityEvidence, false);
});

test("[MAT-27] ignores English stop words such as 'the', 'and', 'for', 'with'", () => {
  const result = scoreMatch(
    { title: "The item lost with cable", description: "For student", category: null, location: null },
    { title: "The thing found with box", description: "For lecturer", category: null, location: null }
  );
  assert.equal(result.score, 0);
});

test("[MAT-28] ignores generic report stop words like 'hilang', 'ditemukan', 'tertinggal'", () => {
  const result = scoreMatch(
    { title: "Laporan barang hilang tertinggal", description: "Mohon info", category: null, location: null },
    { title: "Laporan barang ditemukan temuan", description: "Bisa diambil", category: null, location: null }
  );
  assert.equal(result.score, 0);
});

test("[MAT-29] ignores campus generic stop words like 'kampus', 'gedung', 'pradita'", () => {
  const result = scoreMatch(
    { title: "Tertinggal di kampus pradita gedung", description: "Dekat lantai", category: null, location: null },
    { title: "Ditemukan di kampus pradita gedung", description: "Dekat lantai", category: null, location: null }
  );
  assert.equal(result.score, 0);
});

test("[MAT-30] ignores color stop words like 'hitam', 'putih', 'merah', 'biru'", () => {
  const result = scoreMatch(
    { title: "Barang warna hitam putih", description: "Warna biru hijau", category: null, location: null },
    { title: "Barang warna hitam putih", description: "Warna perak silver", category: null, location: null }
  );
  assert.equal(result.score, 0);
});

// 31 - 40: Specific Real-world Matching Scenarios
test("[MAT-31] rejects MacBook and earphone pair despite matching campus metadata", () => {
  const result = scoreMatch(
    {
      title: "MacBook Air M2",
      description: "Laptop warna abu-abu",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    },
    {
      title: "Earphone Wireless Sony",
      description: "Earphone bluetooth di meja baca",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    }
  );
  assert.equal(result.score, 65); // 40 category + 25 location
  assert.equal(result.hasIdentityEvidence, false);
});

test("[MAT-32] matches identical electronic models symmetrically", () => {
  const a = { title: "Sony WH-1000XM5", description: "Headphone wireless", category: null, location: null };
  const b = { title: "Sony WH-1000XM5", description: "Headphone over-ear", category: null, location: null };
  const resAB = scoreMatch(a, b);
  const resBA = scoreMatch(b, a);
  assert.equal(resAB.score, resBA.score);
  assert.equal(resAB.hasIdentityEvidence, resBA.hasIdentityEvidence);
});

test("[MAT-33] matches KTM (Kartu Tanda Mahasiswa) report accurately", () => {
  const result = scoreMatch(
    { title: "KTM Pradita Mahasiswa", description: "Atas nama Midzan", category: "Dokumen", location: "Kantin" },
    { title: "Ditemukan KTM Pradita", description: "Atas nama Midzan", category: "Dokumen", location: "Kantin" }
  );
  assert.equal(result.hasIdentityEvidence, true);
  assert.ok(result.score >= 85);
});

test("[MAT-34] matches vehicle key reports by brand token", () => {
  const result = scoreMatch(
    { title: "Kunci Motor Honda Vario", description: "Gantungan hitam", category: "Kunci", location: "Parkiran" },
    { title: "Kunci Honda Vario", description: "Ditemukan di basement", category: "Kunci", location: "Parkiran" }
  );
  assert.equal(result.hasIdentityEvidence, true);
  assert.ok(result.reasons.includes("Kata kunci barang cocok"));
});

test("[MAT-35] matches flashdisk storage device reports", () => {
  const result = scoreMatch(
    { title: "Flashdisk SanDisk 64GB", description: "Warna merah", category: "Elektronik", location: "Lab 3" },
    { title: "USB Flashdisk SanDisk", description: "Tertancap di PC 12", category: "Elektronik", location: "Lab 3" }
  );
  assert.equal(result.hasIdentityEvidence, true);
  assert.ok(result.score >= 85);
});

test("[MAT-36] matches prescription eyeglasses by frame brand", () => {
  const result = scoreMatch(
    { title: "Kacamata Minus Rayban", description: "Frame bulat", category: "Aksesoris", location: "Ruang 401" },
    { title: "Kacamata Rayban", description: "Ditemukan di podium", category: "Aksesoris", location: "Ruang 401" }
  );
  assert.equal(result.hasIdentityEvidence, true);
});

test("[MAT-37] matches umbrella reports with brand token", () => {
  const result = scoreMatch(
    { title: "Payung Lipat Jopex", description: "Gagang kayu", category: "Lainnya", location: "Lobby" },
    { title: "Payung Jopex", description: "Ditemukan dekat pintu", category: "Lainnya", location: "Lobby" }
  );
  assert.equal(result.hasIdentityEvidence, true);
});

test("[MAT-38] distinguishes between iPad and iPhone devices", () => {
  const result = scoreMatch(
    { title: "iPad Air 5", description: "Tablet dengan Apple Pencil", category: "Elektronik", location: "Perpus" },
    { title: "iPhone 13 Pro", description: "Smartphone case bening", category: "Elektronik", location: "Perpus" }
  );
  assert.equal(result.hasIdentityEvidence, false);
});

test("[MAT-39] matches water bottle with brand identifier", () => {
  const result = scoreMatch(
    { title: "Botol Corkcicle Canteen", description: "Ukuran 16oz", category: "Perlengkapan", location: "Kantin" },
    { title: "Tumbler Corkcicle", description: "Ditemukan di meja kasir", category: "Perlengkapan", location: "Kantin" }
  );
  assert.equal(result.hasIdentityEvidence, true);
});

test("[MAT-40] matches scientific calculator by Casio FX series", () => {
  const result = scoreMatch(
    { title: "Kalkulator Casio FX-991EX", description: "Untuk ujian fisika", category: "Alat Tulis", location: "Ruang 204" },
    { title: "Kalkulator Casio FX-991EX", description: "Tertinggal di laci", category: "Alat Tulis", location: "Ruang 204" }
  );
  assert.equal(result.hasIdentityEvidence, true);
  assert.equal(result.score, 105);
});

// 41 - 50: Edge cases and Token Length constraints
test("[MAT-41] ignores tokens with fewer than 3 characters", () => {
  const result = scoreMatch(
    { title: "HP XL", description: "Di meja", category: null, location: null },
    { title: "Kaos XL", description: "Di kursi", category: null, location: null }
  );
  assert.equal(result.score, 0);
});

test("[MAT-42] strips complete free-form location phrase from token extraction", () => {
  const location = "Student Lounge Gedung A Lantai 2";
  const result = scoreMatch(
    { title: "Buku catatan di Student Lounge Gedung A Lantai 2", description: "Catatan", category: null, location },
    { title: "Buku gambar di Student Lounge Gedung A Lantai 2", description: "Gambar", category: null, location }
  );
  // 'buku' matches (1 token = 20 pts) + location matches (25 pts) = 45 pts
  assert.equal(result.score, 45);
});

test("[MAT-43] handles Unicode characters and emojis in titles without crashing", () => {
  const result = scoreMatch(
    { title: "Gantungan Kunci Doraemon 🐱", description: "Biru", category: null, location: null },
    { title: "Gantungan Kunci Doraemon ✨", description: "Biru", category: null, location: null }
  );
  assert.equal(result.hasIdentityEvidence, true);
  assert.ok(result.score >= 20);
});

test("[MAT-44] matches items with slash in title tokens", () => {
  const result = scoreMatch(
    { title: "Charger Anker 65W USB-C", description: "Adapter", category: null, location: null },
    { title: "Charger Anker 65W", description: "Kabel hitam", category: null, location: null }
  );
  assert.equal(result.hasIdentityEvidence, true);
});

test("[MAT-45] handles titles that are entirely stop words gracefully", () => {
  const result = scoreMatch(
    { title: "Ini dan itu yang hilang", description: "Dekat perpus", category: null, location: null },
    { title: "Ini dan itu yang ditemukan", description: "Dekat kantin", category: null, location: null }
  );
  assert.equal(result.score, 0);
  assert.equal(result.hasIdentityEvidence, false);
});

test("[MAT-46] scores symmetric comparison consistently between lost and found", () => {
  const item1 = { title: "Mouse Logitech MX Master 3S", description: "Warna hitam", category: "Elektronik", location: "Lab 1" };
  const item2 = { title: "Mouse Logitech MX Master 3S", description: "Tertinggal", category: "Elektronik", location: "Lab 1" };
  assert.equal(scoreMatch(item1, item2).score, scoreMatch(item2, item1).score);
});

test("[MAT-47] awards 0 keyword points when overlapping words are only stop words", () => {
  const result = scoreMatch(
    { title: "Buku", description: "Hilang di lantai perpustakaan pradita", category: null, location: null },
    { title: "Pensil", description: "Ditemukan di lantai perpustakaan pradita", category: null, location: null }
  );
  assert.equal(result.score, 0);
});

test("[MAT-48] returns empty reasons array when score is 0", () => {
  const result = scoreMatch(
    { title: "Payung", description: "Merah", category: "Lainnya", location: "Lobby" },
    { title: "KTM", description: "Kartu", category: "Dokumen", location: "Kantin" }
  );
  assert.deepEqual(result.reasons, []);
});

test("[MAT-49] awards 40 category points without setting hasIdentityEvidence", () => {
  const result = scoreMatch(
    { title: "Dompet", description: "Cokelat", category: "Pakaian", location: null },
    { title: "Sepatu", description: "Ukuran 42", category: "Pakaian", location: null }
  );
  assert.equal(result.score, 40);
  assert.equal(result.hasIdentityEvidence, false);
});

test("[MAT-50] confirms scoreMatch result structure contains exactly score, reasons, and hasIdentityEvidence", () => {
  const result = scoreMatch(
    { title: "Sample", description: "Desc", category: null, location: null },
    { title: "Sample", description: "Desc", category: null, location: null }
  );
  const keys = Object.keys(result).sort();
  assert.deepEqual(keys, ["hasIdentityEvidence", "reasons", "score"]);
});
