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