import "server-only";
import { db } from "@/db";
import { payments, bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { prefixedEnvReader } from "@/lib/env-prefix";

const billplz = prefixedEnvReader("BILLPLZ_");

function billplzAuth() {
  return `Basic ${Buffer.from(billplz.require("API_KEY") + ":").toString("base64")}`;
}
function billplzApiUrl() {
  return billplz.get("API_URL");
}

export interface ReconcileResult {
  paymentId: number;
  billplzId: string | null;
  billplzPaid: boolean | null;
  localStatus: string | null;
  updated: boolean;
}

/**
 * Re-check a single payment against Billplz and sync local state if it has
 * been paid there but not yet marked paid locally.
 *
 * This is the single source of truth shared by the admin dashboard "Sync"
 * button (POST /api/admin?action=reconcile-payment) and the daily
 * reconciliation cron (POST /api/cron/reconcile-payments).
 *
 * NOTE: this deliberately does NOT send the receipt email. The Billplz
 * webhook (src/app/api/webhook/route.ts) already sends it on a real
 * delivery, so reconciling here must stay silent to avoid duplicate emails
 * when both paths fire.
 */
export async function reconcilePayment(
  paymentId: number,
  options: { dryRun?: boolean } = {},
): Promise<ReconcileResult> {
  const dryRun = options.dryRun === true;
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment || !payment.billplzId) {
    return {
      paymentId,
      billplzId: payment?.billplzId ?? null,
      billplzPaid: null,
      localStatus: payment?.status ?? null,
      updated: false,
    };
  }

  let billplzPaid: boolean | null = null;
  try {
    const res = await fetch(`${billplzApiUrl()}/bills/${payment.billplzId}`, {
      headers: { Authorization: billplzAuth() },
    });
    if (res.ok) {
      const data = (await res.json()) as { paid_at?: string | null };
      billplzPaid = Boolean(data.paid_at);
    }
  } catch {
    billplzPaid = null;
  }

  let updated = false;
  if (billplzPaid && payment.status !== "paid" && !dryRun) {
    await db
      .update(payments)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
    if (payment.bookingId) {
      await db
        .update(bookings)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(bookings.id, payment.bookingId));
    }
    updated = true;
  }

  return {
    paymentId: payment.id,
    billplzId: payment.billplzId,
    billplzPaid,
    localStatus: payment.status,
    updated,
  };
}
