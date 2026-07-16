import { createNeonAuth } from "@neondatabase/auth/next/server";
import { prefixedEnvReader } from "@/lib/env-prefix";

const neauth = prefixedEnvReader("NEON_AUTH_");

let _authConfig: { baseUrl: string; cookieSecret: string } | null = null;
function getAuthConfig() {
  if (!_authConfig) {
    const baseUrl = neauth.get("BASE_URL");
    const cookieSecret = neauth.get("COOKIE_SECRET");
    if (!baseUrl || !cookieSecret) {
      throw new Error(
        "Missing required env vars: NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET. " +
          "Auth features will be unavailable until these are set.",
      );
    }
    _authConfig = { baseUrl, cookieSecret };
  }
  return _authConfig;
}

// Backwards-compatible accessor (lazy — does not throw at import time)
export const authConfig = new Proxy({} as { baseUrl: string; cookieSecret: string }, {
  get(_, prop) {
    return (getAuthConfig() as Record<string, unknown>)[prop as string];
  },
});

let _auth: ReturnType<typeof createNeonAuth> | null = null;

function getAuth() {
  if (!_auth) {
    const cfg = getAuthConfig();
    _auth = createNeonAuth({
      baseUrl: cfg.baseUrl,
      cookies: { secret: cfg.cookieSecret },
      logLevel: "warn",
    });
  }
  return _auth;
}

export async function getSession() {
  const { data } = await getAuth().getSession();
  return data;
}

export function handler() {
  return getAuth().handler();
}

export { getAuth };

// Lazy proxy — importing `auth` never throws at module load time.
// It only errors when a method is actually called without the env vars set.
export const auth = new Proxy(
  {} as ReturnType<typeof createNeonAuth>,
  {
    get(_, prop) {
      const instance = getAuth();
      const val = (instance as unknown as Record<string | symbol, unknown>)[prop];
      return typeof val === "function" ? (val as Function).bind(instance) : val;
    },
  },
);
