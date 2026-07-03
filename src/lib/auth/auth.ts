import { createNeonAuth } from "@neondatabase/auth/next/server";

const authConfig = {
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET!,
} as const;

let _auth: ReturnType<typeof createNeonAuth> | null = null;

function getAuth() {
  if (!_auth) {
    _auth = createNeonAuth({
      baseUrl: authConfig.baseUrl,
      cookies: { secret: authConfig.cookieSecret },
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

export { authConfig, getAuth };

export const auth = getAuth();
