import assert from "node:assert/strict";
import test from "node:test";
import { itemCreateSchema, parseIncidentDate } from "./schemas.js";
import { parseInput } from "./validation.js";

test("requires lost report metadata before creating a report", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Dompet hitam",
      reportType: "lost",
      description: "Berisi KTM",
      category: null,
      location: null,
      incidentDate: null
    });
  }, /Periksa kembali data yang dikirim/);
});

test("accepts valid found reports only within operating hours", () => {
  const valid = parseInput(itemCreateSchema, {
    title: "Earphone putih",
    reportType: "found",
    description: "Terdapat di laboratorium desain",
    dropOffPoint: "Student Lounge Gedung A Lantai 2",
    incidentDate: "2026-10-10",
    meetUpTime: "10:30"
  });

  assert.equal(valid.reportType, "found");
  assert.equal(valid.meetUpTime, "10:30");

  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Earphone putih",
      reportType: "found",
      description: "Terdapat di laboratorium desain",
      dropOffPoint: "Student Lounge Gedung A Lantai 2",
      incidentDate: "2026-10-10",
      meetUpTime: "08:00"
    });
  }, /Periksa kembali data yang dikirim/);
});

test("rejects impossible incident dates and future dates", () => {
  assert.throws(() => parseIncidentDate("2026-02-30"), /Tanggal kejadian tidak valid/);
  assert.throws(() => parseIncidentDate("2099-01-01"), /Tanggal kejadian tidak boleh di masa depan/);
});
