import assert from "node:assert/strict";
import test from "node:test";
import { resolveCsrfCookieName } from "../../../../packages/shared/src/cookie-config.js";
import { createSessionEvents, isSessionInvalid, SessionController } from "../../../web/src/auth/session-state.js";

type User = { id: string };
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;
const user: User = { id: "session-test-user" };
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

test("cookie contract uses one local default and validates explicit configuration", () => {
  assert.equal(resolveCsrfCookieName({}), "laf_csrf");
  assert.equal(resolveCsrfCookieName({ csrfName: "local_csrf", publicName: "local_csrf", productionBackend: false }), "local_csrf");
  for (const value of ["", " ", "invalid name", "bad;name", "bad=name", "laf_session", "__Host-laf_session", "__Http-csrf", "__Host-Http-csrf"]) {
    assert.throws(() => resolveCsrfCookieName({ csrfName: value }));
  }
  assert.throws(() => resolveCsrfCookieName({ publicName: "" }));
  assert.throws(() => resolveCsrfCookieName({ publicName: "other_csrf" }));
  assert.throws(() => resolveCsrfCookieName({ csrfName: "__Host-test_csrf", productionBackend: false }));
  assert.throws(() => resolveCsrfCookieName({ csrfName: "__Secure-test_csrf", productionBackend: false }));
  assert.throws(() => resolveCsrfCookieName({ productionBackend: true }));
  assert.throws(() => resolveCsrfCookieName({ csrfName: "local_csrf", productionBackend: true }));
  // Synthetic name validates prefix policy, not a production deployment choice.
  assert.equal(resolveCsrfCookieName({ csrfName: "__Host-test_csrf", productionBackend: true }), "__Host-test_csrf");
});

test("only the two explicit session 401 codes invalidate authentication", () => {
  for (const code of ["AUTH_REQUIRED", "SESSION_EXPIRED"]) assert.ok(isSessionInvalid(failure(401, code)));
  for (const error of [failure(401, "INVALID_CREDENTIALS"), failure(401, "UNKNOWN"), failure(403, "CSRF_INVALID"), failure(403, "INVALID_ORIGIN"), failure(500, "INTERNAL_ERROR"), new Error("network"), null]) {
    assert.equal(isSessionInvalid(error), false);
  }
});

test("reload always checks /me without a CSRF hint and concurrent refreshes share one request", async () => {
  const pending = deferred<unknown>();
  const { session, calls } = fixture(async (path, init) => {
    assert.equal(path, "/api/auth/me");
    assert.equal(init?.cache, "no-store");
    return pending.promise;
  });
  const first = session.refresh();
  const second = session.refresh();
  assert.equal(calls.length, 1);
  pending.resolve({ data: user });
  await Promise.all([first, second]);
  assert.equal(session.getSnapshot().status, "authenticated");
});

for (const endpoint of ["/api/auth/login", "/api/auth/register"] as const) {
  test(`${endpoint} verifies /me before completing and never repeats POST`, async () => {
    const { session, calls } = fixture(async (path) => ({ data: path.endsWith("/me") ? user : { id: "unverified" } }));
    assert.deepEqual(await session.authenticate(endpoint, {}), user);
    assert.deepEqual(calls, [endpoint, "/api/auth/me"]);
  });
}

for (const code of ["AUTH_REQUIRED", "SESSION_EXPIRED"]) {
  test(`${code} from /me produces anonymous state`, async () => {
    const { session } = fixture(async () => { throw failure(401, code); });
    await assert.rejects(session.refresh());
    assert.equal(session.getSnapshot().status, "anonymous");
    assert.equal(session.getSnapshot().user, null);
  });
}

test("network, service and unknown-auth errors keep known user and require manual retry", async () => {
  let error: unknown;
  const { session, calls } = fixture(async () => { if (error) throw error; return { data: user }; });
  await session.refresh();
  for (const next of [new Error("network"), failure(500, "INTERNAL_ERROR"), failure(401, "UNKNOWN")]) {
    error = next;
    await assert.rejects(session.refresh());
    assert.equal(session.getSnapshot().status, "unavailable");
    assert.deepEqual(session.getSnapshot().user, user);
  }
  assert.equal(calls.length, 4);
  error = undefined;
  await session.refresh();
  assert.equal(session.getSnapshot().status, "authenticated");
});

test("initial network outage and timeout are unavailable, not anonymous", async () => {
  const offline = fixture(async () => { throw new Error("offline"); });
  await assert.rejects(offline.session.refresh());
  assert.equal(offline.session.getSnapshot().status, "unavailable");
  let signal: AbortSignal | null | undefined;
  const timed = fixture(async (_path, init) => { signal = init?.signal; return new Promise(() => {}); }, 5);
  await assert.rejects(timed.session.refresh(), /batas waktu/);
  assert.equal(signal?.aborted, true);
  assert.equal(timed.session.getSnapshot().status, "unavailable");
});

test("login POST success followed by unavailable /me is not repeated or treated as logout", async () => {
  const { session, calls } = fixture(async (path) => {
    if (path.endsWith("/me")) throw new Error("offline");
    return { data: user };
  });
  await assert.rejects(session.authenticate("/api/auth/login", {}));
  assert.equal(session.getSnapshot().status, "unavailable");
  assert.deepEqual(calls, ["/api/auth/login", "/api/auth/me"]);
});

test("invalid credentials do not invalidate an existing authenticated user", async () => {
  const { session } = fixture(async (path) => {
    if (path.endsWith("/login")) throw failure(401, "INVALID_CREDENTIALS");
    return { data: user };
  });
  await session.refresh();
  await assert.rejects(session.authenticate("/api/auth/login", {}));
  assert.equal(session.getSnapshot().status, "authenticated");
  assert.deepEqual(session.getSnapshot().user, user);
});

for (const outcome of ["success", "expired"] as const) {
  test(`logout ${outcome} clears local state after server confirmation`, async () => {
    const { session, calls } = fixture(async (path) => {
      if (path.endsWith("/logout") && outcome === "expired") throw failure(401, "SESSION_EXPIRED");
      return { data: user };
    });
    await session.refresh();
    await session.signOut();
    assert.equal(session.getSnapshot().status, "anonymous");
    assert.equal(calls.filter((path) => path.endsWith("/logout")).length, 1);
  });
}

for (const expired of [false, true]) {
  test(`CSRF-rejected logout checks /me once; expired=${expired}`, async () => {
    let logout = false;
    const { session, calls } = fixture(async (path) => {
      if (path.endsWith("/logout")) { logout = true; throw failure(403, "CSRF_INVALID"); }
      if (logout && expired) throw failure(401, "SESSION_EXPIRED");
      return { data: user };
    });
    await session.refresh();
    if (expired) await session.signOut();
    else await assert.rejects(session.signOut());
    assert.equal(session.getSnapshot().status, expired ? "anonymous" : "authenticated");
    assert.deepEqual(calls, ["/api/auth/me", "/api/auth/logout", "/api/auth/me"]);
  });
}

test("Origin-rejected logout never retries or claims success", async () => {
  const { session, calls } = fixture(async (path) => {
    if (path.endsWith("/logout")) throw failure(403, "INVALID_ORIGIN");
    return { data: user };
  });
  await session.refresh();
  await assert.rejects(session.signOut());
  assert.equal(session.getSnapshot().status, "authenticated");
  assert.deepEqual(calls, ["/api/auth/me", "/api/auth/logout"]);
});

test("unavailable CSRF logout verification retains user and does not retry mutation", async () => {
  let logout = false;
  const { session, calls } = fixture(async (path) => {
    if (path.endsWith("/logout")) { logout = true; throw failure(403, "CSRF_INVALID"); }
    if (logout) throw new Error("offline");
    return { data: user };
  });
  await session.refresh();
  await assert.rejects(session.signOut());
  assert.equal(session.getSnapshot().status, "unavailable");
  assert.deepEqual(session.getSnapshot().user, user);
  assert.equal(calls.length, 3);
});

test("late /me success cannot restore a logged-out user", async () => {
  const pending = deferred<unknown>();
  const { session } = fixture(async (path) => path.endsWith("/me") ? pending.promise : undefined);
  const refresh = session.refresh();
  const checked = assert.rejects(refresh);
  await session.signOut();
  pending.resolve({ data: user });
  await checked;
  assert.equal(session.getSnapshot().status, "anonymous");
});

test("late /me failure and invalidation cannot cancel a newer login", async () => {
  const pending = deferred<unknown>();
  let checks = 0;
  const { session, events } = fixture(async (path) => {
    if (path.endsWith("/me") && checks++ === 0) return pending.promise;
    return { data: user };
  });
  const generation = events.current();
  const old = assert.rejects(session.refresh());
  await session.authenticate("/api/auth/login", {});
  events.invalidate(generation);
  pending.reject(failure(401, "SESSION_EXPIRED"));
  await old;
  assert.equal(session.getSnapshot().status, "authenticated");
});

test("password rotation verifies the replacement session and ignores previous-generation invalidation", async () => {
  const { session, events, calls } = fixture(async () => ({ data: user }));
  await session.refresh();
  const old = events.current();
  await session.changePassword({ currentPassword: "", newPassword: "" });
  events.invalidate(old);
  assert.equal(session.getSnapshot().status, "authenticated");
  assert.deepEqual(calls, ["/api/auth/me", "/api/auth/password", "/api/auth/me"]);
});

test("current-generation invalidation clears state without requesting /me", async () => {
  const { session, events, calls } = fixture(async () => ({ data: user }));
  await session.refresh();
  events.invalidate(events.current());
  assert.equal(session.getSnapshot().status, "anonymous");
  assert.equal(calls.length, 1);
});

test("session transitions abort older browser requests before their cookie-clearing responses arrive", () => {
  const events = createSessionEvents();
  const controller = new AbortController();
  events.trackRequest(events.current(), () => controller.abort());
  events.advance();
  assert.equal(controller.signal.aborted, true);
  const finished = new AbortController();
  const release = events.trackRequest(events.current(), () => finished.abort());
  release();
  events.advance();
  assert.equal(finished.signal.aborted, false);
});

test("new page requests start only after the authenticated generation is committed", async () => {
  const { session, events } = fixture(async () => ({ data: user }));
  const pageRequest = new AbortController();
  session.subscribe(() => {
    if (session.getSnapshot().status === "authenticated") {
      events.trackRequest(events.current(), () => pageRequest.abort());
    }
  });
  await session.authenticate("/api/auth/login", {});
  assert.equal(session.getSnapshot().status, "authenticated");
  assert.equal(pageRequest.signal.aborted, false);
});
