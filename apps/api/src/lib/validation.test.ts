import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { parseInput, paginationSchema } from "./validation.js";
import { ApiError } from "./errors.js";

test("[VAL-01] trims leading and trailing whitespace from string inputs", () => {
  const schema = z.object({ title: z.string() });
  const result = parseInput(schema, { title: "   KTM Pradita   " });
  assert.equal(result.title, "KTM Pradita");
});

test("[VAL-02] converts empty string to undefined so schema default can apply", () => {
  const schema = z.object({ note: z.string().default("default note") });
  const result = parseInput(schema, { note: "" });
  assert.equal(result.note, "default note");
});

test("[VAL-03] converts whitespace-only string to undefined", () => {
  const schema = z.object({ note: z.string().default("default note") });
  const result = parseInput(schema, { note: "     " });
  assert.equal(result.note, "default note");
});

test("[VAL-04] leaves non-empty trimmed strings untouched", () => {
  const schema = z.object({ category: z.string() });
  const result = parseInput(schema, { category: "Elektronik" });
  assert.equal(result.category, "Elektronik");
});

test("[VAL-05] recursively sanitizes nested object properties", () => {
  const schema = z.object({
    user: z.object({
      name: z.string(),
      bio: z.string().optional()
    })
  });
  const result = parseInput(schema, {
    user: { name: "  Ayu  ", bio: "   " }
  });
  assert.equal(result.user.name, "Ayu");
  assert.equal(result.user.bio, undefined);
});

test("[VAL-06] strips undefined fields from sanitized objects", () => {
  const schema = z.object({ a: z.string().optional(), b: z.string() });
  const result = parseInput(schema, { a: "  ", b: "valid" });
  assert.equal("a" in result, false);
  assert.equal(result.b, "valid");
});

test("[VAL-07] recursively sanitizes string elements inside arrays", () => {
  const schema = z.object({ tags: z.array(z.string()) });
  const result = parseInput(schema, { tags: ["  tag1  ", "tag2 "] });
  assert.deepEqual(result.tags, ["tag1", "tag2"]);
});

test("[VAL-08] filters out whitespace-only entries from string arrays", () => {
  const schema = z.object({ tags: z.array(z.string()) });
  const result = parseInput(schema, { tags: ["item", "   ", "item2"] });
  assert.deepEqual(result.tags, ["item", "item2"]);
});

test("[VAL-09] preserves numeric values without unwanted type conversion", () => {
  const schema = z.object({ count: z.number() });
  const result = parseInput(schema, { count: 42 });
  assert.equal(result.count, 42);
  assert.equal(typeof result.count, "number");
});

test("[VAL-10] preserves boolean values correctly", () => {
  const schema = z.object({ isVerified: z.boolean(), isArchived: z.boolean() });
  const result = parseInput(schema, { isVerified: true, isArchived: false });
  assert.equal(result.isVerified, true);
  assert.equal(result.isArchived, false);
});

test("[VAL-11] preserves null values when nullable schema permits", () => {
  const schema = z.object({ notes: z.string().nullable() });
  const result = parseInput(schema, { notes: null });
  assert.equal(result.notes, null);
});

test("[VAL-12] handles 3-level deeply nested structures cleanly", () => {
  const schema = z.object({
    level1: z.object({
      level2: z.object({
        level3: z.string()
      })
    })
  });
  const result = parseInput(schema, {
    level1: { level2: { level3: "   Deep Value   " } }
  });
  assert.equal(result.level1.level2.level3, "Deep Value");
});

test("[VAL-13] throws ApiError with status 400 when schema validation fails", () => {
  const schema = z.object({ email: z.string().email() });
  assert.throws(
    () => parseInput(schema, { email: "not-an-email" }),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.code, "VALIDATION_ERROR");
      return true;
    }
  );
});

test("[VAL-14] maps failed field names in ApiError.fields accurately", () => {
  const schema = z.object({ title: z.string().min(5), age: z.number().min(18) });
  assert.throws(
    () => parseInput(schema, { title: "abc", age: 10 }),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.ok(error.fields?.title);
      assert.ok(error.fields?.age);
      return true;
    }
  );
});

test("[VAL-15] preserves HTML/script characters for application-level escaping", () => {
  const schema = z.object({ comment: z.string() });
  const result = parseInput(schema, { comment: "<script>alert('xss')</script>" });
  assert.equal(result.comment, "<script>alert('xss')</script>");
});

test("[VAL-16] safely passes control characters and Unicode characters intact", () => {
  const schema = z.object({ text: z.string() });
  const result = parseInput(schema, { text: "Mahasiswa Informatika 🚀" });
  assert.equal(result.text, "Mahasiswa Informatika 🚀");
});

test("[VAL-17] paginationSchema coerces string numbers to integers for page", () => {
  const result = parseInput(paginationSchema, { page: "3" });
  assert.equal(result.page, 3);
  assert.equal(typeof result.page, "number");
});

test("[VAL-18] paginationSchema coerces string numbers to integers for pageSize", () => {
  const result = parseInput(paginationSchema, { pageSize: "50" });
  assert.equal(result.pageSize, 50);
  assert.equal(typeof result.pageSize, "number");
});

test("[VAL-19] paginationSchema defaults page to 1 when omitted", () => {
  const result = parseInput(paginationSchema, {});
  assert.equal(result.page, 1);
});

test("[VAL-20] paginationSchema defaults pageSize to 20 when omitted", () => {
  const result = parseInput(paginationSchema, {});
  assert.equal(result.pageSize, 20);
});

test("[VAL-21] paginationSchema rejects page number less than 1", () => {
  assert.throws(
    () => parseInput(paginationSchema, { page: 0 }),
    /Periksa kembali data yang dikirim/
  );
});

test("[VAL-22] paginationSchema rejects negative page number", () => {
  assert.throws(
    () => parseInput(paginationSchema, { page: -5 }),
    /Periksa kembali data yang dikirim/
  );
});

test("[VAL-23] paginationSchema accepts maximum allowed pageSize of 100", () => {
  const result = parseInput(paginationSchema, { pageSize: 100 });
  assert.equal(result.pageSize, 100);
});

test("[VAL-24] paginationSchema rejects pageSize greater than 100", () => {
  assert.throws(
    () => parseInput(paginationSchema, { pageSize: 101 }),
    /Periksa kembali data yang dikirim/
  );
});

test("[VAL-25] paginationSchema rejects non-numeric string values", () => {
  assert.throws(
    () => parseInput(paginationSchema, { page: "abc" }),
    /Periksa kembali data yang dikirim/
  );
});
