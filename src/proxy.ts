import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { limit } from "@/lib/rate-limit";

// --- Auth route protection constants ---

const SESSION_COOKIE_NAMES = [
  "__Secure-neon-auth.session_token",
  "neon-auth.session_token",
];

const PROTECTED_ROUTES = [
  "/profile",
  "/favorites",
  "/rewards",
  "/subscription",
  "/payments",
  "/beauty-profile",
  "/onboarding",
  "/bookings",
];

const PROTECTED_API_PREFIXES = [
  "/api/user",
];

const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/health",
  "/api/webhook",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => !!request.cookies.get(name)?.value);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => {
    if (pathname === route) return true;
    if (!pathname.startsWith(route + "/")) return false;
    // /bookings/:id is guest-accessible (booking detail page)
    if (route === "/bookings" && /^\/bookings\/[^/]+$/.test(pathname)) return false;
    return true;
  });
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// --- Proxy (formerly Middleware) ---

function withSecurityHeaders(res: NextResponse, nonce: string) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.headers.set("x-nonce", nonce);
  res.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'unsafe-eval' 'nonce-${nonce}' https://static.cloudflareinsights.com https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com https://api.cloudinary.com https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io; frame-src 'none'; object-src 'none'`,
  );
  return res;
}

const authMiddleware = auth.middleware({
  loginUrl: "/login",
});

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = generateNonce();

  if (
    (pathname.startsWith("/dashboard/") || pathname === "/dashboard") &&
    !pathname.startsWith("/api/auth/")
  ) {
    const response = await authMiddleware(request);
    if (response) {
      return withSecurityHeaders(response, nonce);
    }
  }

  if (pathname.startsWith("/api")) {
    if (isPublicApiPath(pathname)) {
      return withSecurityHeaders(NextResponse.next(), nonce);
    }

    // Allow API routes to handle their own auth - middleware returns 401 too early
    // and breaks legitimate API calls from authenticated users on client-side
    // The API routes will validate session themselves

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const { success, remaining, reset } = await limit(ip);

    if (!success) {
      const res = new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429 },
      );
      res.headers.set("X-RateLimit-Limit", "60");
      res.headers.set("X-RateLimit-Remaining", String(remaining));
      res.headers.set("X-RateLimit-Reset", String(reset));
      return withSecurityHeaders(res, nonce);
    }
  }

  if (isProtectedRoute(pathname) && !hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return withSecurityHeaders(NextResponse.next(), nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
