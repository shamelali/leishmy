import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls, urlAnalytics } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { limit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Skip if it's a known route
    if (code.startsWith("api/") || code === "favicon.ico" || code === "_next" || code === "robots.txt" || code === "sitemap.xml") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ip = getClientIp(request);
    const rl = await limit(`url-redirect:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: 60 },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const urlRecord = await db.select().from(urls).where(eq(urls.code, code)).limit(1);
    
    if (urlRecord.length === 0) {
      return NextResponse.json({ error: "Short URL not found" }, { status: 404 });
    }

    // Fire analytics writes without blocking the redirect
    Promise.all([
      db
        .update(urls)
        .set({ 
          clicks: sql`${urls.clicks} + 1`,
          updatedAt: new Date()
        })
        .where(eq(urls.code, code)),
      db.insert(urlAnalytics).values({
        code,
        referer: request.headers.get("referer") || null,
        userAgent: request.headers.get("user-agent") || null,
        country: request.headers.get("x-vercel-ip-country") || "unknown",
      }),
    ]).catch((err) => console.error("[url-shortener] analytics write failed:", err));

    return NextResponse.redirect(urlRecord[0].url, 302);
  } catch (err) {
    console.error("URL redirect error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
