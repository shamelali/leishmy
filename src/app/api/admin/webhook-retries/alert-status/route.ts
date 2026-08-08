import { NextRequest, NextResponse } from "next/server";
import { WebhookAlertingService } from "@/lib/alerting/webhook-alerting";
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
    const thresholdStr = searchParams.get("threshold") || "10";
    const threshold = parseInt(thresholdStr, 10);

    const alertStatus = await WebhookAlertingService.checkDeadLetterQueueThreshold(
      isNaN(threshold) ? 10 : threshold
    );

    return NextResponse.json({
      success: true,
      data: alertStatus
    });
  } catch (error) {
    console.error("Error checking webhook alert status:", error);
    return NextResponse.json(
      { error: "Failed to check webhook alert status" },
      { status: 500 }
    );
  }
}