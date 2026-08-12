import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { createHmac, timingSafeEqual } from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { PaymentAnalytics } from "@/lib/payment-analytics";
import { describeWebhookResult } from "@/lib/billplz-payment";
import { processBillplzPaymentWebhook } from "@/lib/billplz-payment-webhook";
import { WebhookRetryService } from "@/lib/webhook-retry";

export const runtime = "nodejs";

const billplz = prefixedEnvReader("BILLPLZ_");

function parseWebhookBody(rawBody: string, contentType: string): Record<string, unknown> {
  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody) as Record<string, unknown>;
  }
  const params = new URLSearchParams(rawBody);
  return Object.fromEntries(params.entries());
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const rawBody = await request.text();
  const signatureKey = billplz.get("SIGNATURE_KEY");

  if (!signatureKey) {
    return NextResponse.json({ error: "Billplz signature key not configured" }, { status: 500 });
  }

  const signatureHeader = request.headers.get("x-signature") || "";
  const computedSignature = createHmac("sha256", signatureKey)
    .update(rawBody)
    .digest("hex");
  const computedBuf = Buffer.from(computedSignature, "utf-8");
  const headerBuf = Buffer.from(signatureHeader, "utf-8");

  if (computedBuf.length !== headerBuf.length || !timingSafeEqual(computedBuf, headerBuf)) {
    const bodyPreview = rawBody
      .slice(0, 150)
      .replace(/email=[^&]*/gi, "email=redacted")
      .replace(/name=[^&]*/gi, "name=redacted")
      .replace(/phone=[^&]*/gi, "phone=redacted");
    await db
      .insert(webhookEvents)
      .values({
        event: "billplz.payment.rejected",
        payload: { reason: "invalid_signature", body: bodyPreview },
        status: "rejected",
      })
      .catch(() => {});

    await PaymentAnalytics.trackPaymentEvent("webhook_signature_failed", 0, {
      signatureHeader,
      bodyPreviewLength: bodyPreview.length,
    });

    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let webhookEventId: number | null = null;

  try {
    const body = parseWebhookBody(rawBody, request.headers.get("content-type") || "");

    const [webhookEvent] = await db
      .insert(webhookEvents)
      .values({
        event: "billplz.payment",
        payload: body,
        status: "received",
      })
      .returning({ id: webhookEvents.id });

    webhookEventId = webhookEvent.id;

    const result = await processBillplzPaymentWebhook(body);

    if (result.status === "processed" || result.status === "duplicate" || result.status === "ignored") {
      await WebhookRetryService.finalizeEvent(webhookEventId, "processed", {
        processedAt: new Date().toISOString(),
        replayStatus: result.status,
      });

      await PaymentAnalytics.trackPaymentEvent("webhook_processed_success", webhookEventId, {
        webhookEventId,
        replayStatus: result.status,
        paymentId: result.status === "ignored" ? 0 : result.paymentId,
        processingTimeMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        duplicate: result.status === "duplicate" ? true : undefined,
        ignored: result.status === "ignored" ? result.reason : undefined,
      });
    }

    if (result.status === "amount_mismatch") {
      await WebhookRetryService.finalizeEvent(webhookEventId, "mismatch", {
        replayStatus: result.status,
        lastError: describeWebhookResult(result),
      });
      return NextResponse.json({
        success: false,
        error: "Amount mismatch",
        amountMismatch: true,
      });
    }

    await WebhookRetryService.enqueueForRetry(webhookEventId, describeWebhookResult(result));

    if (result.status === "no_payment") {
      return NextResponse.json({ success: true, pending: true });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } catch (err) {
    console.error("Webhook error:", err);

    await PaymentAnalytics.trackPaymentEvent("webhook_error", 0, {
      error: err instanceof Error ? err.message : String(err),
    });

    if (webhookEventId !== null) {
      await WebhookRetryService.enqueueForRetry(
        webhookEventId,
        err instanceof Error ? err.message : String(err),
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
