export const LOCAL_CSRF_COOKIE_NAME = "laf_csrf";

interface CookieConfig {
  csrfName?: string;
  publicName?: string;
  productionBackend?: boolean;
}

/** Only public cookie names belong here. Never pass secrets to the browser. */
export function resolveCsrfCookieName(config: CookieConfig): string {
  if (config.productionBackend && config.csrfName === undefined) {
    throw new Error("CSRF_COOKIE_NAME must be configured explicitly before production deployment.");
  }
  const name = config.csrfName ?? LOCAL_CSRF_COOKIE_NAME;
  for (const [key, value] of [["CSRF_COOKIE_NAME", name], ["VITE_CSRF_COOKIE_NAME", config.publicName]] as const) {
    if (value !== undefined && !/^[A-Za-z0-9_-]+$/.test(value)) {
      throw new Error(`${key} must be a non-empty cookie name containing only letters, digits, underscores or hyphens.`);
    }
  }
  if (name === "laf_session" || name === "__Host-laf_session") {
    throw new Error("CSRF_COOKIE_NAME must not use a session cookie name.");
  }
  if (config.publicName !== undefined && config.publicName !== name) {
    throw new Error("VITE_CSRF_COOKIE_NAME must match CSRF_COOKIE_NAME.");
  }
  // CSRF cookies are readable by JavaScript, so HttpOnly prefixes cannot apply.
  if (name.startsWith("__Http-") || name.startsWith("__Host-Http-")) {
    throw new Error("CSRF_COOKIE_NAME cannot require HttpOnly.");
  }
  if (config.productionBackend === false && (name.startsWith("__Host-") || name.startsWith("__Secure-"))) {
    throw new Error("CSRF_COOKIE_NAME prefix requires Secure cookies; the local backend does not issue them.");
  }
  if (config.productionBackend === true && !name.startsWith("__Host-")) {
    throw new Error("Production CSRF_COOKIE_NAME must preserve the __Host- prefix and HTTPS cookie requirements.");
  }
  return name;
}
