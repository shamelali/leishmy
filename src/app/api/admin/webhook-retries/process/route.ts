import { NextRequest, NextResponse } from "next/server";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { getAuthSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    // Get webhook events ready for retry
    const events = await WebhookRetryService.getReadyForRetry(
      isNaN(limit) ? 20 : limit
    );

    let processed = 0;
    let failed = 0;
    let skipped = 0;
    let deadLettered = 0;
    let retried = 0;

    for (const event of events) {
      try {
        const result = await WebhookRetryService.processRetry(event.id);
        if (result.status === "processed") {
          processed += 1;
        } else if (result.status === "skipped") {
          skipped += 1;
        } else {
          failed += 1;
          if (result.status === "dead_letter") deadLettered += 1;
        }
        retried += 1;
      } catch (error) {
        console.error(`[admin-webhook-retry] Failed to process event ${event.id}:`, error);
        failed += 1;
        retried += 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        failed,
        skipped,
        deadLettered,
        attempted: retried,
        message: `Processed ${processed}, failed ${failed}, skipped ${skipped}, dead-lettered ${deadLettered}, total attempted ${retried}`,
      },
    });
  } catch (error) {
    console.error("Error processing webhook retries:", error);
    return NextResponse.json(
      { error: "Failed to process webhook retries" },
      { status: 500 }
    );
  }
}