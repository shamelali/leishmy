import { NextRequest, NextResponse } from "next/server";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { getAuthSession } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";

export const revalidate = 0; // Always fresh data
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.role !== "admin" && !session.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limitStr = searchParams.get("limit") || "20";
    const limit = parseInt(limitStr, 10);

    const retryEvents = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, "retry_scheduled"))
      .orderBy(webhookEvents.createdAt)
      .limit(isNaN(limit) ? 20 : limit);

    return NextResponse.json({
      success: true,
      data: retryEvents
    });
  } catch (error) {
    console.error("Error fetching retry scheduled webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch retry scheduled webhooks" },
      { status: 500 }
    );
  }
}