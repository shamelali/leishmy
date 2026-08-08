import { NextRequest, NextResponse } from "next/server";
import { PaymentAnalytics } from "@/lib/payment-analytics";
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
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    // Get webhook metrics
    const webhookMetrics = await PaymentAnalytics.getWebhookMetrics(startDate, endDate);
    
    // Get detailed webhook retry metrics
    const webhookRetryDetails = await PaymentAnalytics.getWebhookRetryDetails(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        webhookMetrics,
        webhookRetryDetails,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    console.error("Error fetching webhook retry analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook retry analytics" },
      { status: 500 }
    );
  }
}