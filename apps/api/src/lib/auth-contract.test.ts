import assert from "node:assert/strict";
import test from "node:test";
import { resolveCsrfCookieName } from "../../../../packages/shared/src/cookie-config.js";
import { createSessionEvents, isSessionInvalid, SessionController } from "../../../web/src/auth/session-state.js";

type User = { id: string; name?: string };
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
const user: User = { id: "session-test-user", name: "Test Mahasiswa" };
const failure = (status: number, code: string) => Object.assign(new Error(code), { status, code });

function fixture(handler: (path: string, init?: RequestInit) => Promise<unknown>, timeout = 1000) {
  const calls: string[] = [];
  const events = createSessionEvents();
  const request = (async (path: string, init?: RequestInit) => {
    calls.push(path);
    return handler(path, init);
  }) as Request;
  const session = new SessionController<User>(request, events, timeout);
  session.connect();
  return { session, events, calls };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// 1 - 10: Cookie resolution tests
test("[AUT-01] resolveCsrfCookieName uses laf_csrf as default in standard local environment", () => {
  assert.equal(resolveCsrfCookieName({}), "laf_csrf");
});

test("[AUT-02] resolveCsrfCookieName accepts valid custom local CSRF cookie name", () => {
  assert.equal(resolveCsrfCookieName({ csrfName: "local_csrf", publicName: "local_csrf", productionBackend: false }), "local_csrf");
});

test("[AUT-03] resolveCsrfCookieName rejects empty string as cookie name", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "" }));
});

test("[AUT-04] resolveCsrfCookieName rejects whitespace-only string", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "   " }));
});

test("[AUT-05] resolveCsrfCookieName rejects cookie names containing spaces", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "bad cookie name" }));
});

test("[AUT-06] resolveCsrfCookieName rejects cookie names containing semicolons", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "bad;name" }));
});

test("[AUT-07] resolveCsrfCookieName rejects cookie names containing equals sign", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "bad=name" }));
});

test("[AUT-08] resolveCsrfCookieName rejects laf_session collision name", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "laf_session" }));
});

test("[AUT-09] resolveCsrfCookieName rejects __Host-laf_session prefix collision", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "__Host-laf_session" }));
});

test("[AUT-10] resolveCsrfCookieName rejects invalid pseudo-prefix __Http-csrf", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "__Http-csrf" }));
});

// 11 - 15: Cookie production prefix policies
test("[AUT-11] resolveCsrfCookieName rejects __Host- prefix in local development (non-production)", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "__Host-test_csrf", productionBackend: false }));
});

test("[AUT-12] resolveCsrfCookieName rejects __Secure- prefix in local development (non-production)", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "__Secure-test_csrf", productionBackend: false }));
});

test("[AUT-13] resolveCsrfCookieName requires prefix when productionBackend is true", () => {
  assert.throws(() => resolveCsrfCookieName({ productionBackend: true }));
});

test("[AUT-14] resolveCsrfCookieName rejects un-prefixed name when productionBackend is true", () => {
  assert.throws(() => resolveCsrfCookieName({ csrfName: "local_csrf", productionBackend: true }));
});

test("[AUT-15] resolveCsrfCookieName accepts valid __Host- prefix when productionBackend is true", () => {
  assert.equal(resolveCsrfCookieName({ csrfName: "__Host-test_csrf", productionBackend: true }), "__Host-test_csrf");
});

// 16 - 22: Invalidation code checks
test("[AUT-16] isSessionInvalid returns true for 401 AUTH_REQUIRED", () => {
  assert.equal(isSessionInvalid(failure(401, "AUTH_REQUIRED")), true);
});

test("[AUT-17] isSessionInvalid returns true for 401 SESSION_EXPIRED", () => {
  assert.equal(isSessionInvalid(failure(401, "SESSION_EXPIRED")), true);
});

test("[AUT-18] isSessionInvalid returns false for 401 INVALID_CREDENTIALS", () => {
  assert.equal(isSessionInvalid(failure(401, "INVALID_CREDENTIALS")), false);
});

test("[AUT-19] isSessionInvalid returns false for 401 UNKNOWN error code", () => {
  assert.equal(isSessionInvalid(failure(401, "UNKNOWN")), false);
});

test("[AUT-20] isSessionInvalid returns false for 403 CSRF_INVALID", () => {
  assert.equal(isSessionInvalid(failure(403, "CSRF_INVALID")), false);
});

test("[AUT-21] isSessionInvalid returns false for 403 INVALID_ORIGIN", () => {
  assert.equal(isSessionInvalid(failure(403, "INVALID_ORIGIN")), false);
});

test("[AUT-22] isSessionInvalid returns false for 500 INTERNAL_ERROR or network outage", () => {
  assert.equal(isSessionInvalid(failure(500, "INTERNAL_ERROR")), false);
  assert.equal(isSessionInvalid(new Error("Network failed")), false);
  assert.equal(isSessionInvalid(null), false);
});

// 23 - 35: SessionController lifecycle tests
test("[AUT-23] reload always checks /me with no-store cache header", async () => {
  const { session, calls } = fixture(async (path, init) => {
    assert.equal(path, "/api/auth/me");
    assert.equal(init?.cache, "no-store");
    return { data: user };
  });
  await session.refresh();
  assert.deepEqual(calls, ["/api/auth/me"]);
  assert.equal(session.getSnapshot().status, "authenticated");
});

test("[AUT-24] concurrent refresh calls share a single in-flight network request", async () => {
  const pending = deferred<unknown>();
  const { session, calls } = fixture(async () => pending.promise);
  const first = session.refresh();
  const second = session.refresh();
  assert.equal(calls.length, 1);
  pending.resolve({ data: user });
  await Promise.all([first, second]);
  assert.equal(session.getSnapshot().status, "authenticated");
});

test("[AUT-25] login verifies /me before resolving authentication", async () => {
  const { session, calls } = fixture(async (path) => ({ data: path.endsWith("/me") ? user : { id: "temp" } }));
  const result = await session.authenticate("/api/auth/login", {});
  assert.deepEqual(result, user);
  assert.deepEqual(calls, ["/api/auth/login", "/api/auth/me"]);
});

test("[AUT-26] register verifies /me before resolving authentication", async () => {
  const { session, calls } = fixture(async (path) => ({ data: path.endsWith("/me") ? user : { id: "temp" } }));
  const result = await session.authenticate("/api/auth/register", {});
  assert.deepEqual(result, user);
  assert.deepEqual(calls, ["/api/auth/register", "/api/auth/me"]);
});

test("[AUT-27] AUTH_REQUIRED from /me transitions session state to anonymous", async () => {
  const { session } = fixture(async () => { throw failure(401, "AUTH_REQUIRED"); });
  await assert.rejects(session.refresh());
  assert.equal(session.getSnapshot().status, "anonymous");
  assert.equal(session.getSnapshot().user, null);
});

test("[AUT-28] SESSION_EXPIRED from /me transitions session state to anonymous", async () => {
  const { session } = fixture(async () => { throw failure(401, "SESSION_EXPIRED"); });
  await assert.rejects(session.refresh());
  assert.equal(session.getSnapshot().status, "anonymous");
  assert.equal(session.getSnapshot().user, null);
});

test("[AUT-29] network error preserves known user profile and enters unavailable state", async () => {
  let error: unknown;
  const { session } = fixture(async () => { if (error) throw error; return { data: user }; });
  await session.refresh();
  assert.equal(session.getSnapshot().status, "authenticated");
  error = new Error("Network offline");
  await assert.rejects(session.refresh());
  assert.equal(session.getSnapshot().status, "unavailable");
  assert.deepEqual(session.getSnapshot().user, user);
});

test("[AUT-30] initial network timeout enters unavailable state rather than anonymous", async () => {
  const offline = fixture(async () => { throw new Error("Connection timed out"); });
  await assert.rejects(offline.session.refresh());
  assert.equal(offline.session.getSnapshot().status, "unavailable");
});

test("[AUT-31] invalid credentials during active session does not destroy current user", async () => {
  const { session } = fixture(async (path) => {
    if (path.includes("login")) throw failure(401, "INVALID_CREDENTIALS");
    return { data: user };
  });
  await session.refresh();
  await assert.rejects(session.authenticate("/api/auth/login", {}));
  assert.equal(session.getSnapshot().status, "authenticated");
  assert.deepEqual(session.getSnapshot().user, user);
});

test("[AUT-32] successful logout clears local user state after server response", async () => {
  const { session } = fixture(async (path) => {
    if (path.includes("logout")) return { data: { success: true } };
    return { data: user };
  });
  await session.refresh();
  await session.signOut();
  assert.equal(session.getSnapshot().status, "anonymous");
  assert.equal(session.getSnapshot().user, null);
});

test("[AUT-33] logout expired on server transitions to anonymous cleanly", async () => {
  const { session } = fixture(async (path) => {
    if (path.includes("logout")) throw failure(401, "SESSION_EXPIRED");
    return { data: user };
  });
  await session.refresh();
  await session.signOut();
  assert.equal(session.getSnapshot().status, "anonymous");
});

test("[AUT-34] late response from old generation cannot overwrite active login", async () => {
  const older = deferred<unknown>();
  let mode = "old";
  const { session } = fixture(async () => {
    if (mode === "old") return older.promise;
    return { data: { id: "newer-user", name: "New User" } };
  });
  const oldRefresh = session.refresh();
  mode = "new";
  await session.authenticate("/api/auth/login", {});
  assert.equal(session.getSnapshot().user?.id, "newer-user");
  older.resolve({ data: { id: "stale-user", name: "Stale User" } });
  await oldRefresh.catch(() => {});
  assert.equal(session.getSnapshot().user?.id, "newer-user");
});

test("[AUT-35] current-generation invalidation transitions immediately to anonymous without network call", () => {
  const { session, events, calls } = fixture(async () => ({ data: user }));
  events.invalidate(events.current());
  assert.equal(session.getSnapshot().status, "anonymous");
  assert.equal(calls.length, 0);
});
