export type SessionStatus = "checking" | "authenticated" | "anonymous" | "unavailable";
export interface SessionSnapshot<T> {
  status: SessionStatus;
  user: T | null;
  error: string | null;
}

export function isSessionInvalid(error: unknown): boolean {
  const value = error as { status?: number; code?: string } | null;
  return value?.status === 401 && (value.code === "AUTH_REQUIRED" || value.code === "SESSION_EXPIRED");
}

export function createSessionEvents() {
  let generation = 0;
  const listeners = new Set<(generation: number) => void>();
  const pending = new Map<() => void, number>();
  return {
    current: () => generation,
    advance() {
      ++generation;
      for (const [abort, started] of pending) {
        if (started !== generation) { pending.delete(abort); abort(); }
      }
      return generation;
    },
    trackRequest(started: number, abort: () => void) {
      if (started !== generation) abort();
      else pending.set(abort, started);
      return () => { pending.delete(abort); };
    },
    subscribe(listener: (generation: number) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    invalidate(requestGeneration: number) {
      if (requestGeneration === generation) for (const listener of listeners) listener(requestGeneration);
    }
  };
}

export const sessionEvents = createSessionEvents();
type SessionEvents = ReturnType<typeof createSessionEvents>;
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

/** Owned by AuthProvider; independent of React so request races can be tested. */
export class SessionController<T extends { id: string }> {
  private snapshot: SessionSnapshot<T> = { status: "checking", user: null, error: null };
  private listeners = new Set<() => void>();
  private inFlight?: { generation: number; promise: Promise<T> };
  private transitioning = false;
  private pendingSnapshot?: SessionSnapshot<T>;

  constructor(private request: Request, private events: SessionEvents = sessionEvents, private timeoutMs = 10_000) {}

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  connect = () => this.events.subscribe((generation) => {
    if (!this.transitioning && generation === this.events.current()) this.anonymous();
  });

  private set(status: SessionStatus, user = this.snapshot.user, error: string | null = null) {
    if (this.transitioning && status !== "checking") {
      this.pendingSnapshot = { status, user, error };
      return;
    }
    this.snapshot = { status, user, error };
    for (const listener of this.listeners) listener();
  }

  private anonymous() {
    this.events.advance();
    this.set("anonymous", null);
  }

  private check(generation: number): Promise<T> {
    if (this.inFlight?.generation === generation) return this.inFlight.promise;
    this.set("checking");
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Verifikasi sesi melewati batas waktu. Silakan coba lagi."));
        controller.abort();
      }, this.timeoutMs);
    });
    const promise = Promise.race([
      this.request<{ data: T }>("/api/auth/me", { signal: controller.signal, cache: "no-store" }),
      timeout
    ]).then((response) => {
      if (!response?.data || typeof response.data.id !== "string") throw new Error("Respons verifikasi sesi tidak valid.");
      if (generation !== this.events.current()) throw new Error("Hasil verifikasi sesi sudah tidak relevan.");
      this.set("authenticated", response.data);
      return response.data;
    }).catch((error: unknown) => {
      if (generation === this.events.current()) {
        if (isSessionInvalid(error)) this.anonymous();
        else this.set("unavailable", this.snapshot.user, error instanceof Error ? error.message : "Sesi belum dapat diverifikasi.");
      }
      throw error;
    }).finally(() => {
      clearTimeout(timer);
      if (this.inFlight?.promise === promise) this.inFlight = undefined;
    });
    this.inFlight = { generation, promise };
    return promise;
  }

  refresh = async (): Promise<void> => {
    if (this.transitioning) return;
    await this.check(this.events.current());
  };

  private async transition<R>(action: (generation: number) => Promise<R>): Promise<R> {
    if (this.transitioning) throw new Error("Proses akun masih berlangsung. Tunggu hingga selesai.");
    this.transitioning = true;
    const previous = this.snapshot;
    const generation = this.events.advance();
    try {
      return await action(generation);
    } catch (error) {
      if (generation === this.events.current()) {
        if (isSessionInvalid(error)) this.anonymous();
        else if ((this.pendingSnapshot ?? this.snapshot).status !== "unavailable") {
          const status = (error as { status?: number })?.status;
          if (status && status >= 400 && status < 500 && previous.status !== "checking") {
            this.set(previous.status, previous.user, previous.error);
          } else {
            this.set("unavailable", previous.user, error instanceof Error ? error.message : "Layanan akun belum tersedia.");
          }
        }
      }
      throw error;
    } finally {
      this.events.advance();
      this.transitioning = false;
      if (this.pendingSnapshot) {
        const next = this.pendingSnapshot;
        this.pendingSnapshot = undefined;
        this.set(next.status, next.user, next.error);
      }
    }
  }

  authenticate = (path: "/api/auth/login" | "/api/auth/register", body: unknown): Promise<T> =>
    this.transition(async (generation) => {
      await this.request(path, { method: "POST", body: JSON.stringify(body) });
      return this.check(generation);
    });

  changePassword = (body: { currentPassword: string; newPassword: string }): Promise<T> =>
    this.transition(async (generation) => {
      await this.request("/api/auth/password", { method: "PUT", body: JSON.stringify(body) });
      return this.check(generation);
    });

  signOut = (): Promise<void> => this.transition(async (generation) => {
    try {
      await this.request("/api/auth/logout", { method: "POST" });
    } catch (error) {
      if (!isSessionInvalid(error)) {
        if ((error as { status?: number; code?: string })?.status !== 403
          || (error as { code?: string }).code !== "CSRF_INVALID") throw error;
        try {
          await this.check(generation);
        } catch (checkError) {
          if (isSessionInvalid(checkError)) return;
          throw checkError;
        }
        throw error;
      }
    }
    this.anonymous();
  });
}
