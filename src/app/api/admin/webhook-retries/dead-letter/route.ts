import { NextRequest, NextResponse } from "next/server";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { getAuthSession } from "@/lib/auth/server";

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
    const limitStr = searchParams.get("limit") || "50";
    const limit = parseInt(limitStr, 10);

    const deadLetterEvents = await WebhookRetryService.getDeadLetterEvents(
      isNaN(limit) ? 50 : limit
    );

    return NextResponse.json({
      success: true,
      data: deadLetterEvents
    });
  } catch (error) {
    console.error("Error fetching dead letter webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch dead letter webhooks" },
      { status: 500 }
    );
  }
}