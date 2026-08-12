import { db } from "@/db";
import { bookings, notifications, payments, users, webhookEvents } from "@/db/schema";
import { sendPaymentReceiptEmail } from "@/lib/email/payment-receipt";
import { sendPaymentConfirmation } from "@/lib/notifications/whatsapp";
import { PaymentAnalytics } from "@/lib/payment-analytics";
import {
  amountsMatch,
  buildBookingPaymentUpdate,
  classifyBookingPayment,
  extractBillplzCallback,
  isBillplzPaid,
  parseBillplzPaidAt,
  parseWebhookAmountCents,
  type BillplzCallback,
  type BillplzPaymentWebhookResult,
  type BookingPaymentKind,
} from "@/lib/billplz-payment";
import { and, eq, sql } from "drizzle-orm";

export type { BillplzPaymentWebhookResult } from "@/lib/billplz-payment";
export {
  describeWebhookResult,
  isRetryableWebhookResult,
  isSuccessfulWebhookReplay,
} from "@/lib/billplz-payment";

export type PaymentRow = {
  id: number;
  bookingId: number | null;
  amount: number;
  status: string | null;
  billplzId: string | null;
  method: string | null;
};

export type BookingRow = {
  id: number;
  userId: string;
  artistId: string | null;
  amount: string | number;
  depositAmount: string | number | null;
  date: Date;
  secondPaymentDueDate: Date | null;
  remainingPaymentSent: boolean | null;
  status: string | null;
};

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
};

export type NotificationInsert = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

export type ApplyPaidCallbackResult =
  | {
      status: "processed";
      payment: PaymentRow;
      booking: BookingRow | null;
      kind: BookingPaymentKind;
      transitioned: true;
    }
  | {
      status: "duplicate";
      payment: PaymentRow;
      booking: BookingRow | null;
      kind: BookingPaymentKind;
      transitioned: false;
    }
  | {
      status: "amount_mismatch";
      payment: PaymentRow;
      webhookAmount: number;
      localAmount: number;
    }
  | { status: "no_payment"; billplzId: string };

export interface BillplzPaymentWebhookStore {
  applyPaidCallback(input: {
    billplzId: string;
    paidAt: Date;
    now: Date;
    webhookAmountCents: number | null;
  }): Promise<ApplyPaidCallbackResult>;
  findUser(id: string): Promise<UserRow | null>;
  insertNotification(notification: NotificationInsert): Promise<void>;
}

export type BillplzPaymentWebhookDeps = {
  store: BillplzPaymentWebhookStore;
  sendPaymentReceiptEmail: (
    params: Parameters<typeof sendPaymentReceiptEmail>[0],
  ) => Promise<unknown>;
  sendPaymentConfirmation: (
    params: Parameters<typeof sendPaymentConfirmation>[0],
  ) => Promise<unknown>;
  trackPaymentEvent: (
    eventType: string,
    paymentId: number,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  recordAmountMismatch: (
    callback: BillplzCallback,
    localAmount: number,
  ) => Promise<void>;
  now: () => Date;
};

function mapPayment(row: typeof payments.$inferSelect): PaymentRow {
  return {
    id: row.id,
    bookingId: row.bookingId,
    amount: row.amount,
    status: row.status,
    billplzId: row.billplzId,
    method: row.method,
  };
}

function mapBooking(row: typeof bookings.$inferSelect): BookingRow {
  return {
    id: row.id,
    userId: row.userId,
    artistId: row.artistId,
    amount: row.amount,
    depositAmount: row.depositAmount,
    date: row.date,
    secondPaymentDueDate: row.secondPaymentDueDate,
    remainingPaymentSent: row.remainingPaymentSent,
    status: row.status,
  };
}

function classifyForPayment(payment: PaymentRow, booking: BookingRow | null): BookingPaymentKind {
  if (!booking) return "unclassified";
  return classifyBookingPayment({
    paymentAmountCents: Number(payment.amount),
    bookingAmountMyr: booking.amount,
    depositAmountMyr: booking.depositAmount,
  }).kind;
}

export const postgresBillplzPaymentStore: BillplzPaymentWebhookStore = {
  async applyPaidCallback(input) {
    return db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.billplzId, input.billplzId))
        .for("update")
        .limit(1);

      if (!payment) {
        return { status: "no_payment", billplzId: input.billplzId };
      }

      if (!amountsMatch(input.webhookAmountCents, payment.amount)) {
        return {
          status: "amount_mismatch",
          payment: mapPayment(payment),
          webhookAmount: Number(input.webhookAmountCents),
          localAmount: Number(payment.amount),
        };
      }

      let booking: BookingRow | null = null;
      if (payment.bookingId) {
        const [row] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .for("update")
          .limit(1);
        booking = row ? mapBooking(row) : null;
      }

      const kind = classifyForPayment(mapPayment(payment), booking);

      if (payment.status === "paid") {
        return {
          status: "duplicate",
          payment: mapPayment(payment),
          booking,
          kind,
          transitioned: false,
        };
      }

      const [updatedPayment] = await tx
        .update(payments)
        .set({
          status: "paid",
          paidAt: input.paidAt,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(payments.id, payment.id),
            sql`${payments.status} IS DISTINCT FROM 'paid'`,
          ),
        )
        .returning();

      if (!updatedPayment) {
        const [alreadyPaid] = await tx
          .select()
          .from(payments)
          .where(eq(payments.id, payment.id))
          .limit(1);
        return {
          status: "duplicate",
          payment: mapPayment(alreadyPaid ?? payment),
          booking,
          kind,
          transitioned: false,
        };
      }

      if (booking) {
        const update = buildBookingPaymentUpdate({
          kind,
          bookingDate: booking.date,
          existingSecondPaymentDueDate: booking.secondPaymentDueDate,
          now: input.now,
        });
        await tx.update(bookings).set(update).where(eq(bookings.id, booking.id));
        booking = { ...booking, ...update };
      }

      return {
        status: "processed",
        payment: mapPayment(updatedPayment),
        booking,
        kind,
        transitioned: true,
      };
    });
  },

  async findUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user
      ? { id: user.id, email: user.email, name: user.name, phone: user.phone }
      : null;
  },

  async insertNotification(notification) {
    await db.insert(notifications).values(notification);
  },
};

const defaultDeps: BillplzPaymentWebhookDeps = {
  store: postgresBillplzPaymentStore,
  sendPaymentReceiptEmail,
  sendPaymentConfirmation,
  trackPaymentEvent: (eventType, paymentId, metadata) =>
    PaymentAnalytics.trackPaymentEvent(eventType, paymentId, metadata ?? {}),
  async recordAmountMismatch(callback, localAmount) {
    await db.insert(webhookEvents).values({
      event: "billplz.payment.amount_mismatch",
      payload: { ...callback, localPaymentAmount: localAmount },
      status: "mismatch",
    });
  },
  now: () => new Date(),
};

async function sendPaymentSideEffects(
  result: Extract<ApplyPaidCallbackResult, { status: "processed" }>,
  callback: BillplzCallback,
  deps: BillplzPaymentWebhookDeps,
): Promise<void> {
  const { payment, booking } = result;
  if (!booking?.userId) return;

  const user = await deps.store.findUser(booking.userId);
  if (!user) return;

  const paidDate = deps.now().toLocaleDateString("en-MY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paidAt = callback.paid_at
    ? new Date(String(callback.paid_at)).toLocaleDateString("en-MY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : paidDate;

  await deps.store
    .insertNotification({
      userId: booking.userId,
      type: "booking_confirmed",
      title: "Booking Confirmed",
      body: `Your booking #${payment.bookingId} has been confirmed. Payment of MYR ${(Number(payment.amount) / 100).toLocaleString()} received.`,
      data: {
        link: `/bookings/${payment.bookingId}`,
        bookingId: String(payment.bookingId),
      },
    })
    .catch(() => {});

  if (booking.artistId) {
    await deps.store
      .insertNotification({
        userId: booking.artistId,
        type: "booking_confirmed",
        title: "Payment Received — Booking Confirmed",
        body: `Payment received for booking #${payment.bookingId}. The appointment is now confirmed.`,
        data: {
          link: `/bookings/${payment.bookingId}`,
          bookingId: String(payment.bookingId),
        },
      })
      .catch(() => {});
  }

  deps
    .sendPaymentReceiptEmail({
      email: user.email,
      customerName: user.name || "Valued Customer",
      bookingId: String(payment.bookingId),
      amount: Number(payment.amount),
      paymentMethod: "Billplz",
      date: paidAt,
    })
    .catch((err) => console.error("sendPaymentReceiptEmail failed:", err));

  if (user.phone) {
    deps
      .sendPaymentConfirmation({
        customerName: user.name || "Valued Customer",
        bookingId: String(payment.bookingId),
        amount: Number(payment.amount) / 100,
        phone: user.phone,
      })
      .catch((err) => console.error("sendPaymentConfirmation WhatsApp failed:", err));
  }
}

/**
 * Idempotent Billplz payment callback application.
 *
 * Used by the inbound webhook and by webhook-retry replay. Financial writes
 * (payment + booking) happen in one transaction; notifications fire only on
 * the unpaid → paid transition.
 */
export async function processBillplzPaymentWebhook(
  payload: unknown,
  overrides: Partial<BillplzPaymentWebhookDeps> = {},
): Promise<BillplzPaymentWebhookResult> {
  const deps: BillplzPaymentWebhookDeps = { ...defaultDeps, ...overrides };
  const callback = extractBillplzCallback(payload);
  const billplzId = callback.id ? String(callback.id) : "";

  if (!billplzId) {
    return { status: "ignored", reason: "missing_bill_id" };
  }

  if (!isBillplzPaid(callback)) {
    return { status: "ignored", reason: "not_paid" };
  }

  const now = deps.now();
  const paidAt = parseBillplzPaidAt(callback, now);
  const webhookAmountCents = parseWebhookAmountCents(callback);

  let applied: ApplyPaidCallbackResult;
  try {
    applied = await deps.store.applyPaidCallback({
      billplzId,
      paidAt,
      now,
      webhookAmountCents,
    });
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (applied.status === "no_payment") {
    await deps.trackPaymentEvent("webhook_received_no_match", 0, {
      bodyId: billplzId,
      hasPaidAt: Boolean(callback.paid_at),
    });
    return applied;
  }

  if (applied.status === "amount_mismatch") {
    await deps.recordAmountMismatch(callback, applied.localAmount).catch(() => {});
    await deps.trackPaymentEvent("webhook_amount_mismatch", applied.payment.id, {
      webhookAmount: applied.webhookAmount,
      localPaymentAmount: applied.localAmount,
      bookingId: applied.payment.bookingId,
    });
    return {
      status: "amount_mismatch",
      paymentId: applied.payment.id,
      webhookAmount: applied.webhookAmount,
      localAmount: applied.localAmount,
    };
  }

  if (applied.status === "duplicate") {
    await deps.trackPaymentEvent("webhook_duplicate", applied.payment.id, {
      alreadyPaid: true,
    });
    return {
      status: "duplicate",
      paymentId: applied.payment.id,
      bookingId: applied.payment.bookingId,
      kind: applied.kind,
      transitioned: false,
    };
  }

  await deps.trackPaymentEvent("payment_processed_via_webhook", applied.payment.id, {
    paymentAmount: applied.payment.amount,
    paymentMethod: applied.payment.method,
    bookingId: applied.payment.bookingId,
    kind: applied.kind,
  });

  await sendPaymentSideEffects(applied, callback, deps);

  return {
    status: "processed",
    paymentId: applied.payment.id,
    bookingId: applied.payment.bookingId,
    kind: applied.kind,
    transitioned: true,
  };
}
