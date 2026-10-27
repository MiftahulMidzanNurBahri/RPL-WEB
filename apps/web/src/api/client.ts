import { isSessionInvalid, sessionEvents } from "../auth/session-state";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fields: Record<string, string[]> = {}
  ) {
    super(message);
  }
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME;
if (!csrfCookieName) throw new Error("VITE_CSRF_COOKIE_NAME is missing. Restart Vite or rebuild with the cookie configuration.");

function csrfToken(): string | undefined {
  const cookiePrefix = `${csrfCookieName}=`;
  const cookie = document.cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(cookiePrefix));
  const signedValue = cookie?.slice(cookiePrefix.length);
  return signedValue ? decodeURIComponent(signedValue).split(".")[0] : undefined;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const generation = sessionEvents.current();
  const controller = new AbortController();
  const abort = () => controller.abort();
  const release = sessionEvents.trackRequest(generation, abort);
  init.signal?.addEventListener("abort", abort, { once: true });
  if (init.signal?.aborted) abort();
  try {
    return await performRequest<T>(path, { ...init, signal: controller.signal }, generation);
  } finally {
    release();
    init.signal?.removeEventListener("abort", abort);
  }
}

async function performRequest<T>(path: string, init: RequestInit, generation: number): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body !== undefined && !isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (init.method && !["GET", "HEAD", "OPTIONS"].includes(init.method.toUpperCase())) {
    const token = csrfToken();
    if (token) headers.set("x-csrf-token", token);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      ...(/^\/api\/(auth(?:\/|$)|profile(?:\?|$))/.test(path) ? { cache: "no-store" as const } : {}),
      credentials: "include"
    });
  } catch {
    if (init.signal?.aborted) throw new ApiClientError("Permintaan dibatalkan.", 0, "REQUEST_ABORTED");
    throw new ApiClientError(
      "Layanan autentikasi belum dapat dihubungi. Pastikan server backend sedang aktif.",
      0,
      "NETWORK_UNAVAILABLE"
    );
  }

  if (response.status === 204) return undefined as T;

  let rawText: string;
  try {
    rawText = await response.text();
  } catch {
    throw new ApiClientError("Respons layanan belum dapat diterima.", 0, init.signal?.aborted ? "REQUEST_ABORTED" : "NETWORK_UNAVAILABLE");
  }
  let payload: unknown;
  if (rawText.trim().length > 0) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    const error = payload as ApiErrorBody | undefined;
    const defaultMsg =
      response.status >= 500
        ? "Layanan server backend belum siap atau mengalami gangguan."
        : `Terjadi kesalahan saat menghubungi server (${response.status}).`;
    const failure = new ApiClientError(
      error?.error?.message ?? defaultMsg,
      response.status,
      error?.error?.code ?? "REQUEST_FAILED",
      error?.error?.fields ?? {}
    );
    if (isSessionInvalid(failure)) sessionEvents.invalidate(generation);
    throw failure;
  }

  return (payload ?? ({} as T)) as T;
}

export interface ApiList<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface ApiData<T> {
  data: T;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  studentNumber: string | null;
  phone: string | null;
  role: "student" | "faculty_staff" | "campus_staff";
  avatarInitials: string;
  bio: string | null;
  createdAt: string;
}

export interface ApiItem {
  id: string;
  title: string;
  category: string | null;
  reportType: "lost" | "found";
  status: "lost" | "found" | "returned";
  description: string;
  additionalInfo?: string | null;
  location: string | null;
  dropOffPoint?: string | null;
  incidentDate: string | null;
  incidentTime: string | null;
  meetUpTime: string | null;
  imageUrl: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  returnedAt: string | null;
  isMine?: boolean;
  reporter?: { id: string; name: string; avatarInitials: string };
}
