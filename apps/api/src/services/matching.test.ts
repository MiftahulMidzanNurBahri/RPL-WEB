import assert from "node:assert/strict";
import test from "node:test";
import { scoreMatch } from "./matching.js";

test("awards category and location points", () => {
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
  assert.equal(result.hasIdentityEvidence, true);
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
  assert.equal(result.hasIdentityEvidence, false);
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
  assert.equal(result.hasIdentityEvidence, false);
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
  assert.equal(result.hasIdentityEvidence, false);
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
  assert.equal(result.hasIdentityEvidence, false);
  assert.deepEqual(result.reasons, []);
});

test("rejects the seed MacBook and earphone pair despite matching campus metadata", () => {
  const result = scoreMatch(
    {
      title: "MacBook Air M2 13-inch Silver",
      description: "Tertinggal di meja ruang baca Perpustakaan Pradita.",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    },
    {
      title: "Earphone nirkabel dalam casing putih",
      description: "Ditemukan di area baca Perpustakaan Pradita.",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita"
    }
  );

  assert.equal(result.score, 65);
  assert.equal(result.hasIdentityEvidence, false);
  assert.deepEqual(result.reasons, ["Kategori barang sama", "Lokasi kampus sama"]);
});

test("does not treat category alone as identity evidence", () => {
  const result = scoreMatch(
    { title: "Laptop", description: "", category: "Elektronik & Gadget", location: null },
    { title: "Earphone", description: "", category: "Elektronik & Gadget", location: null }
  );

  assert.equal(result.score, 40);
  assert.equal(result.hasIdentityEvidence, false);
  assert.deepEqual(result.reasons, ["Kategori barang sama"]);
});

test("does not treat matching color and reporting context as identity evidence", () => {
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

  assert.equal(result.score, 65);
  assert.equal(result.hasIdentityEvidence, false);
  assert.deepEqual(result.reasons, ["Kategori barang sama", "Lokasi kampus sama"]);
});

test("requires a shared identity token in at least one title", () => {
  const result = scoreMatch(
    { title: "Dompet", description: "Pemindai Canon Lide", category: null, location: null },
    { title: "Buku", description: "Pemindai Canon Lide", category: null, location: null }
  );

  assert.equal(result.score, 40);
  assert.equal(result.hasIdentityEvidence, false);
  assert.deepEqual(result.reasons, ["Kata kunci barang cocok"]);
});

test("accepts title-to-description identity evidence symmetrically with partial metadata", () => {
  const named = { title: "Laptop ASUS Vivobook", description: "", category: null, location: null };
  const described = { title: "Perangkat portabel", description: "Laptop ASUS Vivobook", category: null, location: null };
  const result = scoreMatch(named, described);

  assert.equal(result.score, 40);
  assert.equal(result.hasIdentityEvidence, true);
  assert.deepEqual(result.reasons, ["Kata kunci barang cocok"]);
  assert.deepEqual(scoreMatch(described, named), result);
});

test("does not automatically reject different model identifiers", () => {
  const result = scoreMatch(
    { title: "Laptop ASUS Vivobook A1404", description: "", category: null, location: null },
    { title: "Laptop ASUS Vivobook A1504", description: "", category: null, location: null }
  );

  assert.equal(result.score, 40);
  assert.equal(result.hasIdentityEvidence, true);
});

test("keeps weak title evidence below the recommendation threshold without metadata", () => {
  const result = scoreMatch(
    { title: "Laptop", description: "", category: null, location: null },
    { title: "Laptop", description: "", category: null, location: null }
  );

  assert.equal(result.score, 20);
  assert.equal(result.hasIdentityEvidence, true);
  assert.ok(result.score < 30);
});

test("strips known campus phrases without globally removing computer identity", () => {
  const contextOnly = scoreMatch(
    { title: "Laboratorium Komputer & Desain", description: "", category: null, location: null },
    { title: "Komputer", description: "", category: null, location: null }
  );
  const computer = scoreMatch(
    { title: "Komputer Dell Optiplex", description: "", category: null, location: "Laboratorium Komputer & Desain" },
    { title: "Komputer", description: "", category: null, location: null }
  );

  assert.equal(contextOnly.score, 0);
  assert.equal(contextOnly.hasIdentityEvidence, false);
  assert.equal(computer.score, 20);
  assert.equal(computer.hasIdentityEvidence, true);
});

test("strips complete free-form location phrases across punctuation and spacing", () => {
  const result = scoreMatch(
    {
      title: "Dompet dekat Studio Multimedia Orion",
      description: "",
      category: null,
      location: "Studio Multimedia Orion"
    },
    {
      title: "Buku di STUDIO, MULTIMEDIA - ORION",
      description: "",
      category: null,
      location: " studio multimedia orion "
    }
  );

  assert.equal(result.score, 25);
  assert.equal(result.hasIdentityEvidence, false);
  assert.deepEqual(result.reasons, ["Lokasi kampus sama"]);
});

test("does not match partial tokens within a longer location word", () => {
  const result = scoreMatch(
    { title: "Komputerisasi", description: "", category: null, location: "Lab Komputer" },
    { title: "Komputer", description: "", category: null, location: null }
  );

  assert.equal(result.score, 0);
  assert.equal(result.hasIdentityEvidence, false);
});

test("does not find identity evidence in empty or generic-only tokens", () => {
  for (const text of ["", "   ", "!!!", "Barang hilang ditemukan di area kampus warna putih"]) {
    const result = scoreMatch(
      { title: text, description: text, category: null, location: null },
      { title: text, description: text, category: null, location: null }
    );
    assert.equal(result.score, 0);
    assert.equal(result.hasIdentityEvidence, false);
    assert.deepEqual(result.reasons, []);
  }
});
