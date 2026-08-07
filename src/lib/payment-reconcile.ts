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
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, payment.id));
    if (payment.bookingId) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, payment.bookingId))
        .limit(1);

      if (booking) {
        // Mirror the webhook's side effects so a payment recovered via the
        // reconcile cron (missed webhook) is kept consistent: set the second
        // payment due date for deposits and track remaining-payment receipt.
        const remainingAmount =
          Number(booking.amount) - (Number(booking.depositAmount) || 0);
        const depositCents = Math.round((Number(booking.depositAmount) || 0) * 100);
        const remainingCents = Math.round(remainingAmount * 100);
        const isDepositPayment = Number(payment.amount) === depositCents;
        const isRemainingPayment =
          remainingCents > 0 && Number(payment.amount) === remainingCents;

        const updateData: {
          status: string;
          secondPaymentDueDate?: Date;
          remainingPaymentSent?: boolean;
          updatedAt: Date;
        } = {
          status: "confirmed",
          updatedAt: new Date(),
        };

        if (isDepositPayment && !booking.secondPaymentDueDate) {
          const secondPaymentDate = new Date(booking.date);
          secondPaymentDate.setDate(secondPaymentDate.getDate() + 14);
          updateData.secondPaymentDueDate = secondPaymentDate;
        }

        if (isRemainingPayment) {
          updateData.remainingPaymentSent = true;
        }

        await db
          .update(bookings)
          .set(updateData)
          .where(eq(bookings.id, payment.bookingId));
      }
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
