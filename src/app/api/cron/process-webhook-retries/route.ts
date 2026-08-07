import { NextRequest, NextResponse } from "next/server";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let processed = 0;
    let failed = 0;
    let retried = 0;

    // Get webhook events ready for retry
    const events = await WebhookRetryService.getReadyForRetry(20); // Process up to 20 at a time

    for (const event of events) {
      try {
        const success = await WebhookRetryService.processRetry(event.id);
        if (success) {
          processed += 1;
        } else {
          failed += 1;
        }
        retried += 1;
      } catch (error) {
        console.error(`[webhook-retry-cron] Failed to process event ${event.id}:`, error);
        failed += 1;
        retried += 1;
      }
    }

    await recordCronRun(
      "process-webhook-retries",
      "success",
      `Processed ${processed}, failed ${failed}, total attempted ${retried}`
    );

    return NextResponse.json({
      success: true,
      processed,
      failed,
      attempted: retried,
    });
  } catch (err) {
    console.error("[process-webhook-retries] error:", err);
    await recordCronRun(
      "process-webhook-retries",
      "error",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Webhook retry processing failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}