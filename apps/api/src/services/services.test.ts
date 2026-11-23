import assert from "node:assert/strict";
import test from "node:test";
import {
  ReportRetentionDays,
  reportExpirationDate,
  activeReportWhere
} from "./item-archiving.js";
import {
  ReturnedItemRetentionDays,
  returnedItemCutoff
} from "./returned-item-cleanup.js";

test("[SVC-01] ReportRetentionDays policy is configured to exactly 14 days", () => {
  assert.equal(ReportRetentionDays, 14);
});

test("[SVC-02] reportExpirationDate calculates timestamp exactly 14 days in future", () => {
  const base = new Date("2026-10-01T10:00:00.000Z");
  const expiration = reportExpirationDate(base);
  const diffDays = (expiration.getTime() - base.getTime()) / (1000 * 60 * 60 * 24);
  assert.equal(diffDays, 14);
  assert.equal(expiration.toISOString(), "2026-10-15T10:00:00.000Z");
});

test("[SVC-03] reportExpirationDate defaults to current timestamp when no date is provided", () => {
  const before = Date.now();
  const expiration = reportExpirationDate();
  const after = Date.now();
  const expectedMin = before + 14 * 24 * 60 * 60 * 1000;
  const expectedMax = after + 14 * 24 * 60 * 60 * 1000;
  assert.ok(expiration.getTime() >= expectedMin);
  assert.ok(expiration.getTime() <= expectedMax);
});

test("[SVC-04] activeReportWhere filter specifies only lost and found statuses", () => {
  const filter = activeReportWhere();
  assert.deepEqual(filter.status, { in: ["lost", "found"] });
});

test("[SVC-05] activeReportWhere requires non-archived items", () => {
  const filter = activeReportWhere();
  assert.equal(filter.archivedAt, null);
});

test("[SVC-06] activeReportWhere requires non-deleted items", () => {
  const filter = activeReportWhere();
  assert.equal(filter.deletedAt, null);
});

test("[SVC-07] activeReportWhere enforces expiresAt strictly greater than reference time", () => {
  const refDate = new Date("2026-11-20T12:00:00.000Z");
  const filter = activeReportWhere(refDate);
  assert.deepEqual(filter.expiresAt, { gt: refDate });
});

test("[SVC-08] ReturnedItemRetentionDays policy is configured to exactly 3 days", () => {
  assert.equal(ReturnedItemRetentionDays, 3);
});

test("[SVC-09] returnedItemCutoff calculates cutoff timestamp exactly 3 days prior", () => {
  const base = new Date("2026-11-10T08:00:00.000Z");
  const cutoff = returnedItemCutoff(base);
  const diffDays = (base.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
  assert.equal(diffDays, 3);
  assert.equal(cutoff.toISOString(), "2026-11-07T08:00:00.000Z");
});

test("[SVC-10] returnedItemCutoff defaults to current time and produces valid past date", () => {
  const now = new Date();
  const cutoff = returnedItemCutoff();
  assert.ok(cutoff.getTime() < now.getTime());
  assert.equal(now.getTime() - cutoff.getTime() >= (3 * 24 * 60 * 60 * 1000) - 100, true);
});

