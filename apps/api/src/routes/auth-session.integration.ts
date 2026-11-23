import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { projectRoot } from "../lib/paths.js";

test("authentication, cookie security and scoped cache lifecycle on a disposable database", async (t) => {
  const database = process.env.TEST_DATABASE_URL;
  const cacheRoot = resolve(projectRoot, "node_modules/.cache").replaceAll("\\", "/");
  const normalized = database?.replaceAll("\\", "/");
  assert.ok(normalized && database === process.env.DATABASE_URL
    && normalized.startsWith(`file:${cacheRoot}/cookie-session-`) && normalized.endsWith("/api-test.db"),
  "Set DATABASE_URL and TEST_DATABASE_URL to the same disposable cookie-session cache database.");
  const { app } = await import("../app.js");
  const { prisma } = await import("../lib/prisma.js");
  const { CSRF_COOKIE, SESSION_COOKIE, hashSessionToken } = await import("../lib/sessions.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((yes, no) => { server.once("listening", yes); server.once("error", no); });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const origin = "http://localhost:5173";
  const prefix = `auth-${randomUUID()}`;
  const email = `${prefix}@student.pradita.ac.id`;
  const password = randomUUID();
  const replacement = randomUUID();
  type Auth = { cookie: string; csrf: string; session: string };
  function cookies(response: Response): Auth {
    // Browser semantics: the last Set-Cookie for a name wins (clear + rotate).
    const latest = new Map(response.headers.getSetCookie().map((value) => {
      const pair = value.split(";")[0]!;
      return [pair.slice(0, pair.indexOf("=")), pair] as const;
    }));
    const pairs = [...latest.values()];
    const value = (name: string) => decodeURIComponent(pairs.find((pair) => pair.startsWith(`${name}=`))?.slice(name.length + 1) ?? "");
    return { cookie: pairs.join("; "), csrf: value(CSRF_COOKIE).split(".")[0]!, session: value(SESSION_COOKIE) };
  }
  function noStore(response: Response) { assert.equal(response.headers.get("cache-control"), "no-store"); }
  function cleared(response: Response) {
    const values = response.headers.getSetCookie();
    for (const name of [SESSION_COOKIE, CSRF_COOKIE]) {
      assert.ok(values.some((value) => value.startsWith(`${name}=;`) && /Expires=Thu, 01 Jan 1970/i.test(value) && /Path=\//.test(value)));
    }
  }
  const request = (path: string, method = "GET", auth?: Auth, body?: unknown, headers: Record<string, string> = {}) => fetch(`${base}${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(auth ? { Cookie: auth.cookie, "x-csrf-token": auth.csrf } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const login = async () => {
    const response = await request("/api/auth/login", "POST", undefined, { email, password });
    assert.equal(response.status, 200);
    noStore(response);
    return cookies(response);
  };
  let initial!: Auth;
  let current!: Auth;
  let userId = "";
  try {
    await t.test("registration issues the agreed local cookies with unchanged attributes", async () => {
      const response = await request("/api/auth/register", "POST", undefined, { name: prefix, email, password, confirmPassword: password });
      assert.equal(response.status, 201);
      noStore(response);
      initial = cookies(response);
      assert.ok(initial.session && initial.csrf);
      assert.equal(CSRF_COOKIE, "laf_csrf");
      const headers = response.headers.getSetCookie();
      const session = headers.find((value) => value.startsWith(`${SESSION_COOKIE}=`))!;
      const csrf = headers.find((value) => value.startsWith(`${CSRF_COOKIE}=`))!;
      assert.ok(/HttpOnly/i.test(session));
      assert.ok(!/HttpOnly/i.test(csrf));
      for (const value of [session, csrf]) {
        assert.ok(/SameSite=Lax/i.test(value) && /Path=\//.test(value) && /Max-Age=604800/i.test(value));
        assert.ok(!/;\s*(Domain=|Secure(?:;|$))/i.test(value));
      }
      const payload = await response.json();
      userId = payload.data.id;
      assert.equal(payload.data.passwordHash, undefined);
    });
    await t.test("login followed by /me and reload works without a readable CSRF hint", async () => {
      current = await login();
      for (let i = 0; i < 2; i++) {
        const response = await request("/api/auth/me", "GET", undefined, undefined, { Cookie: `${SESSION_COOKIE}=${encodeURIComponent(current.session)}` });
        assert.equal(response.status, 200);
        noStore(response);
        const data = (await response.json()).data;
        assert.equal(data.id, userId);
        for (const key of ["passwordHash", "token", "tokenHash", "sessionId"]) assert.equal(data[key], undefined);
      }
    });
    await t.test("invalid credentials do not clear existing session cookies", async () => {
      const response = await request("/api/auth/login", "POST", current, { email, password: randomUUID() });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error.code, "INVALID_CREDENTIALS");
      assert.equal(response.headers.getSetCookie().length, 0);
      noStore(response);
    });
    await t.test("profile responses and rejected mutations have no-store and rejection changes no data", async () => {
      const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      for (const headers of [
        { "x-csrf-token": "" }, { "x-csrf-token": "incorrect" },
        { Origin: "https://untrusted.example" }, { Origin: "" }
      ] as Record<string, string>[]) {
        const response = await request("/api/profile", "PUT", current, { name: "must not be saved" }, headers);
        assert.equal(response.status, 403);
        noStore(response);
        assert.equal(response.headers.getSetCookie().length, 0);
      }
      assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).name, before.name);
      for (const response of [await request("/api/profile", "GET", current), await request("/api/profile", "PUT", current, { name: prefix })]) {
        assert.equal(response.status, 200);
        noStore(response);
      }
      const outside = await request("/api/items", "POST", current, {}, { "x-csrf-token": "" });
      assert.equal(outside.status, 403);
      noStore(outside);
    });
    await t.test("expired logout clears exact cookies; CSRF rejection still requires a separate /me", async () => {
      await prisma.session.update({ where: { tokenHash: hashSessionToken(current.session) }, data: { expiresAt: new Date(0) } });
      const expired = await request("/api/auth/logout", "POST", current);
      assert.equal(expired.status, 401);
      cleared(expired);
      noStore(expired);
      const rejected = await request("/api/auth/logout", "POST", current, undefined, { "x-csrf-token": "" });
      assert.equal(rejected.status, 403);
      assert.equal(rejected.headers.getSetCookie().length, 0);
      const verified = await request("/api/auth/me", "GET", current);
      assert.equal(verified.status, 401);
      cleared(verified);
    });
    await t.test("revoked and absent sessions get 401 and no-store outside auth routes too", async () => {
      await prisma.session.delete({ where: { tokenHash: hashSessionToken(initial.session) } });
      for (const [path, auth] of [["/api/auth/me", initial], ["/api/dashboard/me", initial], ["/api/profile", undefined]] as const) {
        const response = await request(path, "GET", auth);
        assert.equal(response.status, 401);
        noStore(response);
        cleared(response);
      }
    });
    await t.test("password rotation revokes all old sessions and replacement cookies work", async () => {
      current = await login();
      const other = await login();
      const changed = await request("/api/auth/password", "PUT", current, { currentPassword: password, newPassword: replacement });
      assert.equal(changed.status, 200);
      noStore(changed);
      const next = cookies(changed);
      for (const old of [current, other]) assert.equal((await request("/api/auth/me", "GET", old)).status, 401);
      current = next;
      assert.equal((await request("/api/auth/me", "GET", current)).status, 200);
      const validMutation = await request("/api/profile", "PUT", current, { name: prefix });
      assert.equal(validMutation.status, 200);
    });
    await t.test("logout still rejects CSRF and Origin failures with a valid session", async () => {
      for (const headers of [{ "x-csrf-token": "" }, { Origin: "https://untrusted.example" }] as Record<string, string>[]) {
        const response = await request("/api/auth/logout", "POST", current, undefined, headers);
        assert.equal(response.status, 403);
        noStore(response);
        assert.equal((await request("/api/auth/me", "GET", current)).status, 200);
      }
      const response = await request("/api/auth/logout", "POST", current);
      assert.equal(response.status, 204);
      noStore(response);
      cleared(response);
      assert.equal((await request("/api/auth/me", "GET", current)).status, 401);
    });
    await t.test("early parser and rate-limit responses retain no-store; public responses stay unmodified", async () => {
      const malformed = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{" });
      assert.ok(malformed.status >= 400);
      noStore(malformed);
      let limited = false;
      for (let i = 0; i < 12; i++) {
        const response = await request("/api/auth/login", "POST", undefined, {});
        noStore(response);
        if (response.status === 429) { limited = true; break; }
      }
      assert.ok(limited);
      for (const path of ["/api/health", "/api/items"]) {
        const response = await request(path);
        assert.equal(response.status, 200);
        assert.notEqual(response.headers.get("cache-control"), "no-store");
      }
    });
  } finally {
    try {
      await prisma.activityLog.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { email } });
    } finally {
      await new Promise<void>((yes, no) => server.close((error) => error ? no(error) : yes()));
      await prisma.$disconnect();
    }
  }
});
