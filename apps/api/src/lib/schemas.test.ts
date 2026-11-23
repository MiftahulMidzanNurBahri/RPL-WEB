import assert from "node:assert/strict";
import test from "node:test";
import {
  itemCreateSchema,
  itemQuerySchema,
  inquiryCreateSchema,
  inquiryUpdateSchema,
  parseIncidentDate,
  emailSchema,
  profileFields,
  registrationSchema,
  loginSchema,
  initials
} from "./schemas.js";
import { parseInput } from "./validation.js";
import { z } from "zod";

// 1 - 15: itemCreateSchema tests
test("[SCH-01] itemCreateSchema requires title field", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      reportType: "found",
      description: "Ditemukan di koridor"
    });
  }, /Periksa kembali data yang dikirim/);
});

test("[SCH-02] itemCreateSchema rejects title exceeding 160 characters", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "A".repeat(161),
      reportType: "found",
      description: "Deskripsi barang"
    });
  }, /Periksa kembali data yang dikirim/);
});

test("[SCH-03] itemCreateSchema rejects empty title", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "   ",
      reportType: "found",
      description: "Deskripsi barang"
    });
  }, /Periksa kembali data yang dikirim/);
});

test("[SCH-04] itemCreateSchema requires description field", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Kunci Motor",
      reportType: "found"
    });
  }, /Periksa kembali data yang dikirim/);
});

test("[SCH-05] itemCreateSchema rejects description exceeding 3000 characters", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Kunci Motor",
      reportType: "found",
      description: "B".repeat(3001)
    });
  }, /Periksa kembali data yang dikirim/);
});

test("[SCH-06] itemCreateSchema rejects invalid reportType", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Kunci Motor",
      reportType: "borrowed",
      description: "Deskripsi barang"
    });
  }, /Periksa kembali data yang dikirim/);
});

test("[SCH-07] itemCreateSchema (lost) requires category", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Dompet",
      reportType: "lost",
      description: "Hilang di perpus",
      location: "Perpustakaan",
      incidentDate: "2026-10-10"
    });
  }, (err: unknown) => {
    const apiErr = err as { fields?: Record<string, string[]> };
    return Boolean(apiErr.fields?.category?.[0]?.includes("Kategori wajib dipilih"));
  });
});

test("[SCH-08] itemCreateSchema (lost) requires location", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Dompet",
      reportType: "lost",
      description: "Hilang di perpus",
      category: "KTM & Dompet",
      incidentDate: "2026-10-10"
    });
  }, (err: unknown) => {
    const apiErr = err as { fields?: Record<string, string[]> };
    return Boolean(apiErr.fields?.location?.[0]?.includes("Lokasi wajib diisi"));
  });
});

test("[SCH-09] itemCreateSchema (lost) requires incidentDate", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Dompet",
      reportType: "lost",
      description: "Hilang di perpus",
      category: "KTM & Dompet",
      location: "Perpustakaan"
    });
  }, (err: unknown) => {
    const apiErr = err as { fields?: Record<string, string[]> };
    return Boolean(apiErr.fields?.incidentDate?.[0]?.includes("Tanggal kejadian wajib diisi"));
  });
});

test("[SCH-10] itemCreateSchema (lost) succeeds with all mandatory fields provided", () => {
  const result = parseInput(itemCreateSchema, {
    title: "KTM Mahasiswa",
    reportType: "lost",
    description: "Hilang saat praktikum",
    category: "KTM & Dompet",
    location: "Lab Komputer Lantai 3",
    incidentDate: "2026-10-10"
  });
  assert.equal(result.title, "KTM Mahasiswa");
  assert.equal(result.reportType, "lost");
});

test("[SCH-11] itemCreateSchema (found) succeeds without category and location", () => {
  const result = parseInput(itemCreateSchema, {
    title: "Earphone TWS",
    reportType: "found",
    description: "Ditemukan di meja kantin"
  });
  assert.equal(result.title, "Earphone TWS");
  assert.equal(result.reportType, "found");
});

test("[SCH-12] itemCreateSchema (found) accepts valid meetUpTime within operating hours", () => {
  const result = parseInput(itemCreateSchema, {
    title: "Jaket Hitam",
    reportType: "found",
    description: "Ditemukan di auditorium",
    meetUpTime: "14:30"
  });
  assert.equal(result.meetUpTime, "14:30");
});

test("[SCH-13] itemCreateSchema (found) accepts boundary meetUpTime 09:00 WIB", () => {
  const result = parseInput(itemCreateSchema, {
    title: "Payung",
    reportType: "found",
    description: "Tertinggal",
    meetUpTime: "09:00"
  });
  assert.equal(result.meetUpTime, "09:00");
});

test("[SCH-14] itemCreateSchema (found) accepts boundary meetUpTime 19:00 WIB", () => {
  const result = parseInput(itemCreateSchema, {
    title: "Payung",
    reportType: "found",
    description: "Tertinggal",
    meetUpTime: "19:00"
  });
  assert.equal(result.meetUpTime, "19:00");
});

test("[SCH-15] itemCreateSchema (found) rejects meetUpTime earlier than 09:00 WIB", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Kacamata",
      reportType: "found",
      description: "Ditemukan pagi",
      meetUpTime: "08:59"
    });
  }, (err: unknown) => {
    const apiErr = err as { fields?: Record<string, string[]> };
    return Boolean(apiErr.fields?.meetUpTime?.[0]?.includes("Waktu penyerahan/pertemuan harus antara 09:00 dan 19:00 WIB"));
  });
});

// 16 - 25: Incident date parsing tests
test("[SCH-16] itemCreateSchema (found) rejects meetUpTime later than 19:00 WIB", () => {
  assert.throws(() => {
    parseInput(itemCreateSchema, {
      title: "Kacamata",
      reportType: "found",
      description: "Ditemukan malam",
      meetUpTime: "19:01"
    });
  }, (err: unknown) => {
    const apiErr = err as { fields?: Record<string, string[]> };
    return Boolean(apiErr.fields?.meetUpTime?.[0]?.includes("Waktu penyerahan/pertemuan harus antara 09:00 dan 19:00 WIB"));
  });
});

test("[SCH-17] parseIncidentDate accepts valid past YYYY-MM-DD date", () => {
  const parsed = parseIncidentDate("2026-05-15");
  assert.equal(parsed.toISOString().slice(0, 10), "2026-05-15");
});

test("[SCH-18] parseIncidentDate accepts today date without throwing", () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const parsed = parseIncidentDate(todayStr);
  assert.equal(parsed.toISOString().slice(0, 10), todayStr);
});

test("[SCH-19] parseIncidentDate rejects impossible leap year date 2026-02-29", () => {
  assert.throws(() => parseIncidentDate("2026-02-29"), /Tanggal kejadian tidak valid/);
});

test("[SCH-20] parseIncidentDate rejects impossible calendar day 2026-04-31", () => {
  assert.throws(() => parseIncidentDate("2026-04-31"), /Tanggal kejadian tidak valid/);
});

test("[SCH-21] parseIncidentDate rejects invalid month 2026-13-01", () => {
  assert.throws(() => parseIncidentDate("2026-13-01"), /Tanggal kejadian tidak valid/);
});

test("[SCH-22] parseIncidentDate rejects future date", () => {
  assert.throws(() => parseIncidentDate("2099-01-01"), /Tanggal kejadian tidak boleh di masa depan/);
});

test("[SCH-23] parseIncidentDate rejects slash-delimited date format", () => {
  assert.throws(() => parseIncidentDate("2026/10/10"), /Tanggal kejadian tidak valid/);
});

test("[SCH-24] parseIncidentDate rejects day-first date format", () => {
  assert.throws(() => parseIncidentDate("10-10-2026"), /Tanggal kejadian tidak valid/);
});

test("[SCH-25] parseIncidentDate rejects arbitrary non-date string", () => {
  assert.throws(() => parseIncidentDate("kemarin-siang"), /Tanggal kejadian tidak valid/);
});

// 26 - 32: emailSchema tests
test("[SCH-26] emailSchema normalizes email address to lowercase", () => {
  const parsed = emailSchema.parse("Ayu.Pratama@Student.Pradita.Ac.Id");
  assert.equal(parsed, "ayu.pratama@student.pradita.ac.id");
});

test("[SCH-27] emailSchema trims leading and trailing whitespace", () => {
  const parsed = emailSchema.parse("   alex@student.pradita.ac.id   ");
  assert.equal(parsed, "alex@student.pradita.ac.id");
});

test("[SCH-28] emailSchema rejects string without at sign", () => {
  assert.throws(() => emailSchema.parse("alexstudent.pradita.ac.id"));
});

test("[SCH-29] emailSchema rejects string without domain", () => {
  assert.throws(() => emailSchema.parse("alex@"));
});

test("[SCH-30] emailSchema rejects email exceeding 254 characters", () => {
  const tooLong = "a".repeat(245) + "@pradita.ac.id";
  assert.throws(() => emailSchema.parse(tooLong));
});

test("[SCH-31] emailSchema accepts standard academic student email", () => {
  const valid = emailSchema.parse("miftahul.midzan@student.pradita.ac.id");
  assert.equal(valid, "miftahul.midzan@student.pradita.ac.id");
});

test("[SCH-32] emailSchema accepts standard staff/faculty email", () => {
  const valid = emailSchema.parse("sarah.jenkins@pradita.ac.id");
  assert.equal(valid, "sarah.jenkins@pradita.ac.id");
});

// 33 - 38: profileFields tests
test("[SCH-33] profileFields.name rejects empty string", () => {
  const schema = z.object({ name: profileFields.name });
  assert.throws(() => schema.parse({ name: "" }));
});

test("[SCH-34] profileFields.name rejects name longer than 120 chars", () => {
  const schema = z.object({ name: profileFields.name });
  assert.throws(() => schema.parse({ name: "C".repeat(121) }));
});

test("[SCH-35] profileFields.phone accepts null or undefined", () => {
  const schema = z.object({ phone: profileFields.phone });
  assert.equal(schema.parse({ phone: null }).phone, null);
  assert.equal(schema.parse({}).phone, undefined);
});

test("[SCH-36] profileFields.phone rejects phone exceeding 32 characters", () => {
  const schema = z.object({ phone: profileFields.phone });
  assert.throws(() => schema.parse({ phone: "08123456789012345678901234567890123" }));
});

test("[SCH-37] profileFields.bio accepts null or undefined", () => {
  const schema = z.object({ bio: profileFields.bio });
  assert.equal(schema.parse({ bio: null }).bio, null);
  assert.equal(schema.parse({}).bio, undefined);
});

test("[SCH-38] profileFields.bio rejects bio exceeding 500 characters", () => {
  const schema = z.object({ bio: profileFields.bio });
  assert.throws(() => schema.parse({ bio: "X".repeat(501) }));
});

// 39 - 41: itemQuerySchema and inquiry schemas
test("[SCH-39] itemQuerySchema parses default sort, page and pageSize", () => {
  const query = parseInput(itemQuerySchema, {});
  assert.equal(query.sort, "newest");
  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 20);
});

test("[SCH-40] inquiryCreateSchema defaults kind to inquiry and validates message", () => {
  const inquiry = parseInput(inquiryCreateSchema, { message: "Apakah barang masih ada?" });
  assert.equal(inquiry.kind, "inquiry");
  assert.equal(inquiry.message, "Apakah barang masih ada?");
});

test("[SCH-41] inquiryUpdateSchema accepts valid inquiry status", () => {
  const update = parseInput(inquiryUpdateSchema, { status: "resolved" });
  assert.equal(update.status, "resolved");
});

// 42 - 45: registrationSchema, loginSchema, initials
test("[SCH-42] registrationSchema requires password and confirmPassword to match", () => {
  assert.throws(() => {
    parseInput(registrationSchema, {
      name: "Budi Santoso",
      email: "budi@student.pradita.ac.id",
      password: "password123",
      confirmPassword: "differentPassword"
    });
  }, (err: unknown) => {
    const apiErr = err as { fields?: Record<string, string[]> };
    return Boolean(apiErr.fields?.confirmPassword?.[0]?.includes("Kata sandi dan konfirmasi kata sandi tidak sama"));
  });
});

test("[SCH-43] registrationSchema succeeds when passwords match and meet minimum 8 chars", () => {
  const reg = parseInput(registrationSchema, {
    name: "Budi Santoso",
    email: "budi@student.pradita.ac.id",
    password: "securePassword123",
    confirmPassword: "securePassword123",
    studentNumber: "20230801099"
  });
  assert.equal(reg.name, "Budi Santoso");
  assert.equal(reg.email, "budi@student.pradita.ac.id");
});

test("[SCH-44] loginSchema parses valid email and password", () => {
  const creds = parseInput(loginSchema, {
    email: "user@student.pradita.ac.id",
    password: "mypassword"
  });
  assert.equal(creds.email, "user@student.pradita.ac.id");
  assert.equal(creds.password, "mypassword");
});

test("[SCH-45] initials extracts two uppercase letters from full name", () => {
  assert.equal(initials("Miftahul Midzan"), "MM");
  assert.equal(initials("Ayu"), "A");
  assert.equal(initials("Sarah Jane Jenkins"), "SJ");
});
