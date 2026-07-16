import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { limit } from "@/lib/rate-limit";
import { routing } from "@/i18n/routing";

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com https://api.cloudinary.com; frame-src 'none'; object-src 'none'",
  );
  return res;
}

const authMiddleware = auth.middleware({
  loginUrl: "/login",
});

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Skip middleware for static assets
  if (
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?|json|webp|txt)$/) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel")
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  // 2. Run locale detection
  const intlResponse = await intlMiddleware(request);

  // 3. Auth check for dashboard routes
  if (pathname.startsWith("/dashboard/") && !pathname.startsWith("/api/auth/")) {
    const authResponse = await authMiddleware(request);
    if (authResponse) {
      return withSecurityHeaders(authResponse);
    }
  }

  // 4. Rate limiting for API routes
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth/") &&
    pathname !== "/api/health"
  ) {
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
      return withSecurityHeaders(res);
    }
  }

  // 5. Apply security headers to the intl response
  return withSecurityHeaders(intlResponse || NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
