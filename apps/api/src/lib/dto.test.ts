import assert from "node:assert/strict";
import test from "node:test";
import {
  userDto,
  itemDto,
  paginationDto,
  maskEmail,
  maskPhone,
  maskStudentNumber
} from "./dto.js";

const mockUser = {
  id: "usr_123",
  name: "Miftahul Midzan",
  email: "miftahul.midzan@student.pradita.ac.id",
  studentNumber: "20230801001",
  phone: "081234567890",
  role: "student",
  avatarInitials: "MM",
  bio: "Mahasiswa Informatika",
  passwordHash: "argon2_secret_hash_value_never_leak",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  lastLoginAt: new Date("2026-11-20T00:00:00.000Z")
};

const mockItem = {
  id: "itm_456",
  reporterId: "usr_123",
  title: "Dompet Kulit Hitam",
  category: "Dompet & Identitas",
  reportType: "lost",
  status: "lost",
  description: "Hilang di kantin lantai 1",
  additionalInfo: "Ada kartu ATM dan PIN tertulis di kertas",
  location: "Kantin Gedung A",
  dropOffPoint: null,
  incidentDate: new Date("2026-11-20T00:00:00.000Z"),
  incidentTime: "12:30",
  meetUpTime: null,
  imagePath: "uploads/wallet.jpg",
  expiresAt: new Date("2026-12-04T00:00:00.000Z"),
  archivedAt: null,
  createdAt: new Date("2026-11-20T00:00:00.000Z"),
  updatedAt: new Date("2026-11-20T00:00:00.000Z"),
  returnedAt: null,
  deletedAt: null
};

test("[DTO-01] userDto strips passwordHash from returned user object", () => {
  const result = userDto(mockUser);
  assert.equal("passwordHash" in result, false);
  assert.equal((result as Record<string, unknown>).passwordHash, undefined);
});

test("[DTO-02] userDto preserves public profile fields id, name, and email", () => {
  const result = userDto(mockUser);
  assert.equal(result.id, "usr_123");
  assert.equal(result.name, "Miftahul Midzan");
  assert.equal(result.email, "miftahul.midzan@student.pradita.ac.id");
});

test("[DTO-03] userDto preserves role and studentNumber", () => {
  const result = userDto(mockUser);
  assert.equal(result.role, "student");
  assert.equal(result.studentNumber, "20230801001");
});

test("[DTO-04] userDto preserves avatar initials and bio", () => {
  const result = userDto(mockUser);
  assert.equal(result.avatarInitials, "MM");
  assert.equal(result.bio, "Mahasiswa Informatika");
});

test("[DTO-05] userDto preserves account timestamps", () => {
  const result = userDto(mockUser);
  assert.equal(result.createdAt.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(result.updatedAt.toISOString(), "2026-01-02T00:00:00.000Z");
});

test("[DTO-06] itemDto removes raw reporterId from output", () => {
  const result = itemDto(mockItem);
  assert.equal("reporterId" in result, false);
  assert.equal((result as Record<string, unknown>).reporterId, undefined);
});

test("[DTO-07] itemDto hides additionalInfo by default for privacy", () => {
  const result = itemDto(mockItem);
  assert.equal("additionalInfo" in result, false);
});

test("[DTO-08] itemDto includes additionalInfo when includePrivate is true", () => {
  const result = itemDto(mockItem, { includePrivate: true });
  assert.equal(result.additionalInfo, "Ada kartu ATM dan PIN tertulis di kertas");
});

test("[DTO-09] itemDto reflects isMine: true when specified for report owner", () => {
  const result = itemDto(mockItem, { isMine: true });
  assert.equal(result.isMine, true);
});

test("[DTO-10] itemDto reflects isMine: false when viewing other users reports", () => {
  const result = itemDto(mockItem, { isMine: false });
  assert.equal(result.isMine, false);
});

test("[DTO-11] itemDto omits isMine key when option is not provided", () => {
  const result = itemDto(mockItem);
  assert.equal("isMine" in result, false);
});

test("[DTO-12] itemDto maps imagePath to public imageUrl", () => {
  const result = itemDto(mockItem);
  assert.equal(result.imageUrl, "/uploads/wallet.jpg");
});

test("[DTO-13] itemDto attaches public reporter summary when present", () => {
  const itemWithReporter = {
    ...mockItem,
    reporter: { id: "usr_123", name: "Miftahul Midzan", avatarInitials: "MM" }
  };
  const result = itemDto(itemWithReporter);
  assert.deepEqual(result.reporter, { id: "usr_123", name: "Miftahul Midzan", avatarInitials: "MM" });
});

test("[DTO-14] paginationDto structures page metadata accurately", () => {
  const result = paginationDto(2, 20, 75);
  assert.deepEqual(result, { page: 2, pageSize: 20, total: 75 });
});

test("[DTO-15] maskEmail masks student academic email keeping domain intact", () => {
  const masked = maskEmail("miftahul.midzan@student.pradita.ac.id");
  assert.equal(masked, "m***n@student.pradita.ac.id");
});

test("[DTO-16] maskEmail masks short username emails gracefully", () => {
  const masked = maskEmail("ab@domain.com");
  assert.equal(masked, "a***@domain.com");
});

test("[DTO-17] maskEmail returns empty string for invalid or missing email input", () => {
  assert.equal(maskEmail(null), "");
  assert.equal(maskEmail(""), "");
  assert.equal(maskEmail("invalid-email"), "");
});

test("[DTO-18] maskPhone masks Indonesian mobile numbers keeping start and end digits", () => {
  const masked = maskPhone("081234567890");
  assert.equal(masked, "0812****7890");
});

test("[DTO-19] maskStudentNumber masks student NIM keeping start and end digits", () => {
  const masked = maskStudentNumber("20230801001");
  assert.equal(masked, "2023****001");
});

test("[DTO-20] maskPhone and maskStudentNumber return empty string for null or empty values", () => {
  assert.equal(maskPhone(null), "");
  assert.equal(maskPhone(""), "");
  assert.equal(maskStudentNumber(null), "");
  assert.equal(maskStudentNumber(""), "");
});
