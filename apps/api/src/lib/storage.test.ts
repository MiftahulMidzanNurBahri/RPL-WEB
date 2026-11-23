import assert from "node:assert/strict";
import test from "node:test";
import {
  getItemImagePublicUrl,
  isValidImageMimeType,
  isAllowedFileSize,
  encodeObjectPath
} from "./storage.js";

test("[STO-01] getItemImagePublicUrl returns null when objectPath is null", () => {
  assert.equal(getItemImagePublicUrl(null), null);
});

test("[STO-02] getItemImagePublicUrl returns null when objectPath is empty string", () => {
  assert.equal(getItemImagePublicUrl(""), null);
});

test("[STO-03] getItemImagePublicUrl normalizes legacy uploads path with leading slash", () => {
  assert.equal(getItemImagePublicUrl("uploads/item-123.jpg"), "/uploads/item-123.jpg");
});

test("[STO-04] getItemImagePublicUrl converts Windows backslashes in legacy upload paths", () => {
  assert.equal(getItemImagePublicUrl("uploads\\subfolder\\item-456.png"), "/uploads/subfolder/item-456.png");
});

test("[STO-05] getItemImagePublicUrl preserves absolute HTTPS URLs unchanged", () => {
  const url = "https://gjcfexztebhcyulixzfq.supabase.co/storage/v1/object/public/item-images/items/test.png";
  assert.equal(getItemImagePublicUrl(url), url);
});

test("[STO-06] getItemImagePublicUrl preserves absolute HTTP URLs unchanged", () => {
  const url = "http://localhost:3000/uploads/demo.jpg";
  assert.equal(getItemImagePublicUrl(url), url);
});

test("[STO-07] encodeObjectPath preserves standard clean paths without alteration", () => {
  assert.equal(encodeObjectPath("items/uuid-file.png"), "items/uuid-file.png");
});

test("[STO-08] encodeObjectPath URL-encodes special characters in filename segments", () => {
  assert.equal(encodeObjectPath("items/foto dompet (1).jpg"), "items/foto%20dompet%20(1).jpg");
});

test("[STO-09] encodeObjectPath keeps folder separation forward slashes intact", () => {
  const path = "nested/folder/structure/item.webp";
  assert.equal(encodeObjectPath(path), path);
});

test("[STO-10] isValidImageMimeType accepts image/jpeg", () => {
  assert.equal(isValidImageMimeType("image/jpeg"), true);
});

test("[STO-11] isValidImageMimeType accepts image/png", () => {
  assert.equal(isValidImageMimeType("image/png"), true);
});

test("[STO-12] isValidImageMimeType accepts image/webp", () => {
  assert.equal(isValidImageMimeType("image/webp"), true);
});

test("[STO-13] isValidImageMimeType rejects unsafe or non-image MIME types", () => {
  assert.equal(isValidImageMimeType("text/html"), false);
  assert.equal(isValidImageMimeType("application/javascript"), false);
  assert.equal(isValidImageMimeType("application/x-msdownload"), false);
  assert.equal(isValidImageMimeType("application/pdf"), false);
});

test("[STO-14] isAllowedFileSize accepts file payloads within the 5 MB limit", () => {
  assert.equal(isAllowedFileSize(1024), true); // 1 KB
  assert.equal(isAllowedFileSize(1024 * 1024), true); // 1 MB
  assert.equal(isAllowedFileSize(5 * 1024 * 1024), true); // exactly 5 MB
});

test("[STO-15] isAllowedFileSize rejects zero-byte or oversized file payloads", () => {
  assert.equal(isAllowedFileSize(0), false);
  assert.equal(isAllowedFileSize(-50), false);
  assert.equal(isAllowedFileSize(5 * 1024 * 1024 + 1), false); // 5 MB + 1 byte
  assert.equal(isAllowedFileSize(20 * 1024 * 1024), false); // 20 MB
});

