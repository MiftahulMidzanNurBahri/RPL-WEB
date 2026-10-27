import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { Prisma } from "@prisma/client";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

function extractCookiesAndCsrf(setCookieHeaders: string[]): { cookieHeader: string; csrfToken: string } {
  const cookies: string[] = [];
  let csrfToken = "";

  for (const header of setCookieHeaders) {
    const parts = header.split(";");
    const [cookiePair] = parts;
    if (cookiePair) {
      cookies.push(cookiePair.trim());
      if (cookiePair.trim().startsWith("laf_csrf=")) {
        const rawValue = cookiePair.trim().slice("laf_csrf=".length);
        csrfToken = decodeURIComponent(rawValue).split(".")[0] ?? "";
      }
    }
  }

  return { cookieHeader: cookies.join("; "), csrfToken };
}

test("E2E API Flow: Authentication, Catalog, Items, Inquiries, and Return Lifecycle", async () => {
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Server failed to bind");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const studentEmail = `student_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@student.pradita.ac.id`;
  const facultyEmail = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@pradita.ac.id`;
  const studentNumber = `NIM${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  const password = "password123";

  try {
    // 1. Rejects invalid email domain
    const rejectInvalidRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
      body: JSON.stringify({
        name: "Test Hacker",
        email: "hacker@gmail.com",
        password,
        confirmPassword: password
      })
    });
    assert.equal(rejectInvalidRes.status, 400);
    const rejectInvalidData = await rejectInvalidRes.json();
    assert.equal(rejectInvalidData.error.code, "INSTITUTION_EMAIL_REQUIRED");

    // 2. Registers student successfully
    const registerStudentRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
      body: JSON.stringify({
        name: "Budi Santoso",
        email: studentEmail,
        studentNumber,
        password,
        confirmPassword: password
      })
    });
    assert.equal(registerStudentRes.status, 201);
    const studentUser = (await registerStudentRes.json()).data;
    assert.equal(studentUser.role, "student");
    assert.equal(studentUser.email, studentEmail);

    const studentAuth = extractCookiesAndCsrf(registerStudentRes.headers.getSetCookie());

    // 3. Registers faculty successfully
    const registerFacultyRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
      body: JSON.stringify({
        name: "Dr. Budi Dosen",
        email: facultyEmail,
        password,
        confirmPassword: password
      })
    });
    assert.equal(registerFacultyRes.status, 201);
    const facultyUser = (await registerFacultyRes.json()).data;
    assert.equal(facultyUser.role, "faculty_staff");

    const facultyAuth = extractCookiesAndCsrf(registerFacultyRes.headers.getSetCookie());

    // 4. Verifies /me endpoint with session cookie
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: studentAuth.cookieHeader, Origin: "http://localhost:5173" }
    });
    assert.equal(meRes.status, 200);
    const meData = (await meRes.json()).data;
    assert.equal(meData.id, studentUser.id);

    // 5. Student reports lost item
    const createLostRes = await fetch(`${baseUrl}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentAuth.cookieHeader,
        "x-csrf-token": studentAuth.csrfToken,
        Origin: "http://localhost:5173"
      },
      body: JSON.stringify({
        title: "Kalkulator Casio FX-991EX",
        category: "Elektronik & Gadget",
        reportType: "lost",
        description: "Tertinggal di Lab Komputer setelah praktikum",
        additionalInfo: "Ada goresan huruf B di belakang tutup baterai",
        location: "Laboratorium Komputer & Desain",
        incidentDate: new Date().toISOString().slice(0, 10),
        incidentTime: "10:00"
      })
    });
    assert.equal(createLostRes.status, 201);
    const lostItem = (await createLostRes.json()).data;
    assert.equal(lostItem.status, "lost");
    assert.equal(lostItem.title, "Kalkulator Casio FX-991EX");
    assert.equal(lostItem.isMine, true);
    assert.ok(lostItem.additionalInfo); // Private info visible to owner

    // 6. Public can view detail without additionalInfo
    const publicViewRes = await fetch(`${baseUrl}/api/items/${lostItem.id}`, {
      headers: { Origin: "http://localhost:5173" }
    });
    assert.equal(publicViewRes.status, 200);
    const publicItem = (await publicViewRes.json()).data;
    assert.equal(publicItem.id, lostItem.id);
    assert.equal(publicItem.additionalInfo, undefined); // Hidden from public!

    // 7. Faculty inquires/claims the item
    const sendInquiryRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: facultyAuth.cookieHeader,
        "x-csrf-token": facultyAuth.csrfToken,
        Origin: "http://localhost:5173"
      },
      body: JSON.stringify({
        kind: "claim",
        message: "Saya menemukan kalkulator serupa di meja lab. Hubungi saya di ruang dosen."
      })
    });
    assert.equal(sendInquiryRes.status, 201);
    const inquiryData = (await sendInquiryRes.json()).data;
    assert.equal(inquiryData.kind, "claim");
    assert.equal(inquiryData.status, "pending");

    // 8. Student reads inquiries
    const getInquiriesRes = await fetch(`${baseUrl}/api/inquiries`, {
      headers: { Cookie: studentAuth.cookieHeader, Origin: "http://localhost:5173" }
    });
    assert.equal(getInquiriesRes.status, 200);
    const inquiriesList = (await getInquiriesRes.json()).data;
    const targetInquiry = inquiriesList.find((i: { id: string }) => i.id === inquiryData.id);
    assert.ok(targetInquiry);

    // 9. Student updates inquiry status to replied
    const patchInquiryRes = await fetch(`${baseUrl}/api/inquiries/${inquiryData.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentAuth.cookieHeader,
        "x-csrf-token": studentAuth.csrfToken,
        Origin: "http://localhost:5173"
      },
      body: JSON.stringify({ status: "replied" })
    });
    assert.equal(patchInquiryRes.status, 200);
    const updatedInquiry = (await patchInquiryRes.json()).data;
    assert.equal(updatedInquiry.status, "replied");

    // 10. Student marks item as returned
    const returnItemRes = await fetch(`${baseUrl}/api/items/${lostItem.id}/return`, {
      method: "POST",
      headers: {
        Cookie: studentAuth.cookieHeader,
        "x-csrf-token": studentAuth.csrfToken,
        Origin: "http://localhost:5173"
      }
    });
    assert.equal(returnItemRes.status, 200);
    const returnedItem = (await returnItemRes.json()).data;
    assert.equal(returnedItem.status, "returned");

    // 11. Returned item is excluded from active catalog query
    const catalogRes = await fetch(`${baseUrl}/api/items?q=Kalkulator`, {
      headers: { Origin: "http://localhost:5173" }
    });
    assert.equal(catalogRes.status, 200);
    const catalogList = (await catalogRes.json()).data;
    const foundInActive = catalogList.some((item: { id: string }) => item.id === lostItem.id);
    assert.equal(foundInActive, false); // Excluded from active catalog!

    // 12. Dashboard summary counts correctly
    const summaryRes = await fetch(`${baseUrl}/api/dashboard/summary`, {
      headers: { Origin: "http://localhost:5173" }
    });
    assert.equal(summaryRes.status, 200);
    const summaryData = (await summaryRes.json()).data;
    assert.ok(summaryData.returned >= 1);

    // 13. Profile update
    const updateProfileRes = await fetch(`${baseUrl}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentAuth.cookieHeader,
        "x-csrf-token": studentAuth.csrfToken,
        Origin: "http://localhost:5173"
      },
      body: JSON.stringify({
        name: "Budi Santoso Updated",
        phone: "+6281234567890",
        bio: "Mahasiswa Sistem Informasi Pradita"
      })
    });
    assert.equal(updateProfileRes.status, 200);
    const updatedProfile = (await updateProfileRes.json()).data;
    assert.equal(updatedProfile.name, "Budi Santoso Updated");
    assert.equal(updatedProfile.phone, "+6281234567890");

  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test("matching filters identity, lifecycle and private data consistently before pagination", async () => {
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Server failed to bind");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const prefix = `matching-${randomUUID()}`;
  const now = new Date();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const register = async (suffix: string) => {
      const password = randomUUID();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
        body: JSON.stringify({
          name: `Matching ${suffix}`,
          email: `${prefix}-${suffix}@student.pradita.ac.id`,
          password,
          confirmPassword: password
        })
      });
      assert.equal(response.status, 201);
      return {
        id: (await response.json()).data.id as string,
        ...extractCookiesAndCsrf(response.headers.getSetCookie())
      };
    };
    const owner = await register("owner");
    const other = await register("other");
    const item = (
      suffix: string,
      reporterId: string,
      overrides: Partial<Prisma.ItemCreateManyInput> = {}
    ): Prisma.ItemCreateManyInput => ({
      id: `${prefix}-${suffix}`,
      reporterId,
      title: "MacBook Air M2 13-inch Silver",
      description: "Tertinggal di meja ruang baca Perpustakaan Pradita.",
      category: "Elektronik & Gadget",
      location: "Perpustakaan Pradita",
      reportType: "found",
      status: "found",
      incidentDate: now,
      expiresAt: future,
      ...overrides
    });
    const sourceId = `${prefix}-source`;
    const validIds = ["different-model", "cross-title", "partial"].map((suffix) => `${prefix}-${suffix}`);

    await prisma.item.createMany({
      data: [
        item("source", owner.id, {
          reportType: "lost", status: "lost", additionalInfo: "PRIVATE_OWNER_VERIFICATION"
        }),
        item("different-model", other.id, {
          title: "MacBook Air M1 13-inch",
          additionalInfo: "PRIVATE_CANDIDATE_VERIFICATION"
        }),
        item("cross-title", other.id, {
          title: "Perangkat portabel", description: "MacBook Air M2 13-inch diamankan.",
          category: null, location: null
        }),
        item("partial", other.id, {
          title: "MacBook Air 13-inch", description: "Data pengujian.", category: null, location: null
        }),
        item("seed-earphone", other.id, {
          title: "Earphone nirkabel dalam casing putih",
          description: "Ditemukan di area baca Perpustakaan Pradita."
        }),
        item("category-only", other.id, {
          title: "Headphone nirkabel", description: "", location: null
        }),
        item("weak-evidence", other.id, {
          title: "MacBook", description: "", category: null, location: null
        }),
        item("own-reporter", owner.id, {
          title: "MacBook", description: "Disimpan untuk pengujian.", location: null
        }),
        item("same-type", other.id, {
          reportType: "lost", status: "lost", title: "Perangkat portabel", description: "Air 13-inch"
        }),
        item("returned", other.id, { status: "returned", returnedAt: now }),
        item("archived", other.id, { archivedAt: past }),
        item("expired", other.id, { expiresAt: past }),
        item("deleted", other.id, { deletedAt: now }),
        item("description-source", owner.id, {
          title: "Dompet", description: "Pemindai Canon Lide", reportType: "lost", status: "lost"
        }),
        item("description-only", other.id, {
          title: "Buku", description: "Pemindai Canon Lide", category: null, location: null
        }),
        ...[
          { suffix: "own-returned", status: "returned", returnedAt: now },
          { suffix: "own-archived", archivedAt: past },
          { suffix: "own-expired", expiresAt: past },
          { suffix: "own-deleted", deletedAt: now }
        ].map(({ suffix, ...state }) => item(suffix, owner.id, {
          title: "Router TPLink Archer", description: "", reportType: "lost", status: "lost", ...state
        })),
        item("inactive-owner-candidate", other.id, { title: "Router TPLink Archer", description: "" })
      ]
    });

    const headers = { Cookie: owner.cookieHeader, Origin: "http://localhost:5173" };
    const read = async (path: string) => {
      const response = await fetch(`${baseUrl}${path}`, { headers });
      assert.equal(response.status, 200);
      return response.json();
    };
    const full = await read("/api/matches?page=1&pageSize=100");
    assert.equal(full.pagination.total, validIds.length);
    assert.deepEqual(
      full.data.map((match: { candidate: { id: string } }) => match.candidate.id).sort(),
      [...validIds].sort()
    );
    for (const match of full.data) {
      assert.equal(match.ownItem.id, sourceId);
      assert.equal(match.ownItem.additionalInfo, "PRIVATE_OWNER_VERIFICATION");
      assert.equal(match.candidate.reporter.id, other.id);
      assert.equal("additionalInfo" in match.candidate, false);
      assert.equal("email" in match.candidate.reporter, false);
      assert.equal("phone" in match.candidate.reporter, false);
      assert.equal("hasIdentityEvidence" in match, false);
      assert.equal(match.percentage, Math.round((match.score / 105) * 100));
    }

    const modelMatch = full.data.find((match: { candidate: { id: string } }) => match.candidate.id === validIds[0]);
    assert.equal(modelMatch.score, 105);
    assert.equal(modelMatch.percentage, 100);
    assert.deepEqual(modelMatch.reasons, ["Kategori barang sama", "Kata kunci barang cocok", "Lokasi kampus sama"]);
    const partialMatch = full.data.find((match: { candidate: { id: string } }) => match.candidate.id === validIds[2]);
    assert.equal(partialMatch.score, 40);
    assert.equal(partialMatch.percentage, 38);

    const firstPage = await read("/api/matches?page=1&pageSize=1");
    const secondPage = await read("/api/matches?page=2&pageSize=1");
    assert.equal(firstPage.data.length, 1);
    assert.equal(secondPage.data.length, 1);
    assert.notEqual(firstPage.data[0].candidate.id, secondPage.data[0].candidate.id);
    assert.equal(firstPage.pagination.total, validIds.length);
    assert.equal(secondPage.pagination.total, validIds.length);
    const dashboard = await read("/api/dashboard/me");
    assert.equal(dashboard.data.matchCount, full.pagination.total);
    assert.notEqual(dashboard.data.matchCount, firstPage.data.length);

    const descriptionOnly = await read(`/api/matches?itemId=${prefix}-description-source`);
    assert.equal(descriptionOnly.pagination.total, 0);
    assert.deepEqual(descriptionOnly.data, []);
    const expired = await prisma.item.findUniqueOrThrow({ where: { id: `${prefix}-expired` } });
    assert.ok(expired.archivedAt);

    const publicResponse = await fetch(`${baseUrl}/api/items/${validIds[0]}`);
    assert.equal(publicResponse.status, 200);
    const publicItem = (await publicResponse.json()).data;
    assert.equal("additionalInfo" in publicItem, false);
    assert.equal("email" in publicItem.reporter, false);
    assert.equal("phone" in publicItem.reporter, false);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
