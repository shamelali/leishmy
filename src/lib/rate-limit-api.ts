import { NextRequest, NextResponse } from "next/server";
import { limit } from "./rate-limit";

export async function rateLimitApi(
  request: NextRequest,
  options: { identifier?: string; max?: number; window?: number } = {}
): Promise<NextResponse | null> {
  // Get client IP from Vercel headers or fallback
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const identifier = options.identifier || `${request.method}:${request.nextUrl.pathname}:${ip}`;

  const result = await limit(identifier);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(options.max || 60),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
        },
      }
    );
  }

  return null;
}