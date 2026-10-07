import assert from "node:assert/strict";
import test from "node:test";
import { scoreMatch } from "./matching.js";

test("awards category and location points", () => {
  const result = scoreMatch(
    {
      title: "Laptop silver",
      description: "Ditemukan dekat ruang baca",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    },
    {
      title: "MacBook silver",
      description: "Hilang dekat ruang baca",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    }
  );

  assert.equal(result.score, 105);
  assert.deepEqual(result.reasons, [
    "Kategori barang sama",
    "Kata kunci barang cocok",
    "Lokasi kampus sama"
  ]);
});

test("awards stronger keyword points for at least three shared tokens", () => {
  const result = scoreMatch(
    {
      title: "Laptop silver sleeve",
      description: "MacBook portable computer",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    },
    {
      title: "Laptop silver sleeve",
      description: "MacBook portable computer",
      category: "Buku & Dokumen Kuliah",
      location: "Area Parkir"
    }
  );

  assert.equal(result.score, 40);
  assert.deepEqual(result.reasons, ["Kata kunci barang cocok"]);
});

test("does not award points for unrelated reports", () => {
  const result = scoreMatch(
    {
      title: "Kunci motor",
      description: "Gantungan biru",
      category: "Kunci Kendaraan",
      location: "Area Parkir"
    },
    {
      title: "Buku catatan",
      description: "Sampul merah",
      category: "Buku & Dokumen Kuliah",
      location: "Lobby Utama"
    }
  );

  assert.equal(result.score, 0);
  assert.deepEqual(result.reasons, []);
});

test("matches equivalent free-form locations despite case, punctuation, and spacing", () => {
  const result = scoreMatch(
    {
      title: "Dompet hitam",
      description: "Berisi kartu mahasiswa",
      category: null,
      location: "Lab Komputer, Lantai 3 - Ruang 14"
    },
    {
      title: "Kunci sepeda",
      description: "Gantungan warna hijau",
      category: null,
      location: "  lab komputer lantai 3 ruang 14  "
    }
  );

  assert.equal(result.score, 25);
  assert.deepEqual(result.reasons, ["Lokasi kampus sama"]);
});

test("does not match free-form locations with different room numbers", () => {
  const result = scoreMatch(
    {
      title: "Dompet hitam",
      description: "Berisi kartu mahasiswa",
      category: null,
      location: "Lab Komputer, Lantai 3, Ruang 301"
    },
    {
      title: "Kunci sepeda",
      description: "Gantungan warna hijau",
      category: null,
      location: "Lab Komputer, Lantai 3, Ruang 302"
    }
  );

  assert.equal(result.score, 0);
  assert.deepEqual(result.reasons, []);
});

test("does not award location points for empty or whitespace-only locations", () => {
  const result = scoreMatch(
    {
      title: "Dompet hitam",
      description: "Berisi kartu mahasiswa",
      category: null,
      location: "   "
    },
    {
      title: "Kunci sepeda",
      description: "Gantungan warna hijau",
      category: null,
      location: ""
    }
  );

  assert.equal(result.score, 0);
  assert.deepEqual(result.reasons, []);
});