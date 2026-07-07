import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { limit } from "@/lib/rate-limit";

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
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-src 'none'; object-src 'none'",
  );
  return res;
}

const authMiddleware = auth.middleware({
  loginUrl: "/login",
});

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/dashboard/") &&
    !pathname.startsWith("/api/auth/")
  ) {
    const response = await authMiddleware(request);
    if (response) {
      return withSecurityHeaders(response);
    }
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth/") && pathname !== "/api/health") {
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

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
