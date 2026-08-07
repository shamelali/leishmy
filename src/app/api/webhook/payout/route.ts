import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { payouts, webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { prefixedEnvReader } from "@/lib/env-prefix";

export const runtime = "nodejs";

const billplz = prefixedEnvReader("BILLPLZ_");

/**
 * Billplz V5 Payment Order callback.
 *
 * Billplz POSTs the Payment Order object to the collection's `callback_url`
 * when its status changes to `completed` or `refunded`. Each request includes
 * a `checksum` (HMAC-SHA512 with the X Signature key) computed over:
 *   [ id, bank_account_number, status, total, reference_id, epoch ]
 *
 * On a valid completion/refund we update the matching payout row so the admin
 * `mark-payouts-paid` flow and dashboard reflect the real money movement.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureKey = billplz.get("SIGNATURE_KEY");

  if (!signatureKey) {
    return NextResponse.json({ error: "Billplz signature key not configured" }, { status: 500 });
  }

  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, string>;
  try {
    if (contentType.includes("application/json")) {
      body = JSON.parse(rawBody);
    } else {
      body = Object.fromEntries(new URLSearchParams(rawBody).entries());
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const {
    id,
    bank_account_number,
    status,
    total,
    reference_id,
    epoch,
    checksum,
  } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Verify HMAC-SHA512 checksum (values joined with no separators).
  const computed = createHmac("sha512", signatureKey)
    .update([id, bank_account_number ?? "", status ?? "", total ?? "", reference_id ?? "", epoch ?? ""].join(""))
    .digest("hex");
  const computedBuf = Buffer.from(computed, "utf-8");
  const headerBuf = Buffer.from(checksum ?? "", "utf-8");

  if (computedBuf.length !== headerBuf.length || !timingSafeEqual(computedBuf, headerBuf)) {
    await db
      .insert(webhookEvents)
      .values({
        event: "billplz.payment_order.rejected",
        payload: { reason: "invalid_checksum", body: rawBody.slice(0, 500) },
        status: "rejected",
      })
      .catch(() => {});
    return NextResponse.json({ error: "Invalid checksum" }, { status: 401 });
  }

  await db
    .insert(webhookEvents)
    .values({
      event: "billplz.payment_order",
      payload: body,
      status: "received",
    })
    .catch(() => {});

  if (status !== "completed" && status !== "refunded") {
    return NextResponse.json({ success: true, ignored: status });
  }

  const [payout] = await db
    .select()
    .from(payouts)
    .where(eq(payouts.payoutOrderId, id))
    .limit(1);

  if (!payout) {
    // Unknown order id — log it so missed links are visible.
    await db
      .insert(webhookEvents)
      .values({
        event: "billplz.payment_order.unknown",
        payload: { reason: "no_payout_for_order_id", id },
        status: "mismatch",
      })
      .catch(() => {});
    return NextResponse.json({ success: true, ignored: "unknown order" });
  }

  const completed = status === "completed";
  await db
    .update(payouts)
    .set({
      billplzPayoutStatus: status,
      status: completed ? "paid" : "refunded",
      dispatchedAmount: total ? Number(total) : payout.dispatchedAmount,
      dispatchedAt: completed ? new Date() : payout.dispatchedAt,
      updatedAt: new Date(),
    })
    .where(eq(payouts.id, payout.id));

  return NextResponse.json({ success: true, updated: payout.id });
}
