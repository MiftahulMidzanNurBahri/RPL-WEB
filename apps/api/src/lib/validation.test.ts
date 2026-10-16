import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { profileFields, itemQuerySchema } from "./schemas.js";
import { parseInput } from "./validation.js";

test("ignores blank search filters instead of treating them as real values", () => {
  const result = parseInput(itemQuerySchema, {
    q: "   ",
    location: " ",
    page: "1",
    pageSize: "20"
  });

  assert.equal(result.q, undefined);
  assert.equal(result.location, undefined);
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 20);
});

test("treats blank phone and bio values as absent profile data", () => {
  const profileSchema = z.object(profileFields).strict();

  const result = parseInput(profileSchema, {
    name: "Ayu Pratama",
    phone: "   ",
    bio: " "
  });

  assert.equal(result.phone, undefined);
  assert.equal(result.bio, undefined);
  assert.equal(result.name, "Ayu Pratama");
});
