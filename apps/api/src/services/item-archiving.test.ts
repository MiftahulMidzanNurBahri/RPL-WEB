import assert from "node:assert/strict";
import test from "node:test";
import { activeReportWhere, reportExpirationDate } from "./item-archiving.js";

test("adds the configured 14-day report expiration window", () => {
  const now = new Date("2026-10-10T08:00:00.000Z");
  const result = reportExpirationDate(now);

  assert.equal(result.toISOString(), "2026-10-24T08:00:00.000Z");
});

test("includes only unarchived active lost or found reports in the active query", () => {
  const now = new Date("2026-10-10T08:00:00.000Z");
  const where = activeReportWhere(now);

  assert.deepEqual(where, {
    status: { in: ["lost", "found"] },
    archivedAt: null,
    deletedAt: null,
    expiresAt: { gt: now }
  });
});
