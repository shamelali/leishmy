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
    const deadLetterThresholdStr = searchParams.get("deadLetterThreshold") || "10";
    const retryScheduledThresholdStr = searchParams.get("retryScheduledThreshold") || "100";
    
    const deadLetterThreshold = parseInt(deadLetterThresholdStr, 10);
    const retryScheduledThreshold = parseInt(retryScheduledThresholdStr, 10);

    const healthStatus = await WebhookAlertingService.checkSystemHealth(
      isNaN(deadLetterThreshold) ? 10 : deadLetterThreshold,
      isNaN(retryScheduledThreshold) ? 100 : retryScheduledThreshold
    );

    return NextResponse.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    console.error("Error checking webhook retry system health:", error);
    return NextResponse.json(
      { error: "Failed to check webhook retry system health" },
      { status: 500 }
    );
  }
}