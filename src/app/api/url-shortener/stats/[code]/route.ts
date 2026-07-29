import { NextResponse } from "next/server";
import { db } from "@/db";
import { urls, urlAnalytics } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const urlRecord = await db.select().from(urls).where(eq(urls.code, code)).limit(1);
    
    if (urlRecord.length === 0) {
      return NextResponse.json(
        { error: "Short URL not found" },
        { status: 404 }
      );
    }

    const analytics = await db
      .select()
      .from(urlAnalytics)
      .where(eq(urlAnalytics.code, code))
      .orderBy(desc(urlAnalytics.timestamp))
      .limit(100);

    return NextResponse.json({
      shortCode: code,
      totalClicks: urlRecord[0].clicks,
      recentClicks: analytics.map((a) => ({
        timestamp: a.timestamp,
        referer: a.referer,
        userAgent: a.userAgent,
        country: a.country,
      })),
    });
  } catch (err) {
    console.error("URL stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
