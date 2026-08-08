import { NextRequest, NextResponse } from "next/server";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { webhookEvents } from "@/db/schema";
import { db } from "@/db";
import { eq, count } from "drizzle-orm";

export const revalidate = 0; // Always fresh data
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get counts for different webhook statuses
    const [totalCount] = await db
      .select({ count: count() })
      .from(webhookEvents);

    const [retryCount] = await db
      .select({ count: count() })
      .from(webhookEvents)
      .where(eq(webhookEvents.status, "retry_scheduled"));

    const [deadLetterCount] = await db
      .select({ count: count() })
      .from(webhookEvents)
      .where(eq(webhookEvents.status, "dead_letter"));

    const [processedCount] = await db
      .select({ count: count() })
      .from(webhookEvents)
      .where(eq(webhookEvents.status, "processed"));

    const [receivedCount] = await db
      .select({ count: count() })
      .from(webhookEvents)
      .where(eq(webhookEvents.status, "received"));

    // Determine health status
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    let message = "Webhook retry system is operating normally";

    // If there are dead letter items, it's degraded
    if (Number(deadLetterCount?.count || 0) > 0) {
      status = "degraded";
      message = `There are ${deadLetterCount?.count} webhook events in dead letter queue requiring manual intervention`;
    }
    // If retry queue is growing too large, it might indicate issues
    else if (Number(retryCount?.count || 0) > 100) {
      status = "degraded";
      message = `High volume of webhooks in retry queue: ${retryCount?.count}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        message,
        timestamp: new Date().toISOString(),
        counts: {
          total: Number(totalCount?.count || 0),
          retrySchedulde: Number(retryCount?.count || 0),
          deadLetter: Number(deadLetterCount?.count || 0),
          processed: Number(processedCount?.count || 0),
          received: Number(receivedCount?.count || 0)
        }
      }
    });
  } catch (error) {
    console.error("Error checking webhook retry health:", error);
    return NextResponse.json(
      { error: "Failed to check webhook retry health" },
      { status: 500 }
    );
  }
}