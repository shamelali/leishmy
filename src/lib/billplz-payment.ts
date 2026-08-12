/**
 * Pure Billplz payment-webhook helpers.
 *
 * Kept free of I/O so amount matching, deposit/remaining classification, and
 * payload extraction can be unit-tested without a database.
 */

export const WEBHOOK_RETRY_META_KEYS = [
  "retryCount",
  "processingAttempts",
  "lastError",
  "lastRetryAttempt",
  "nextRetryAt",
  "claimedAt",
  "processedAt",
  "retrySuccess",
  "movedToDeadLetterAt",
  "attemptLog",
  "replayStatus",
  "needsNotifications",
  "notificationsSent",
] as const;

const RETRY_META_KEY_SET = new Set<string>(WEBHOOK_RETRY_META_KEYS);

export type BillplzCallback = {
  id?: string;
  collection_id?: string;
  paid?: string | boolean;
  state?: string;
  amount?: string | number;
  paid_amount?: string | number;
  paid_at?: string | null;
  transaction_id?: string;
  transaction_status?: string;
  email?: string;
  name?: string;
  mobile?: string;
  url?: string;
};

export type BookingPaymentKind = "deposit" | "remaining" | "full" | "unclassified";

export type BookingPaymentUpdate = {
  status: "confirmed";
  updatedAt: Date;
  secondPaymentDueDate?: Date;
  remainingPaymentSent?: boolean;
};

export function asPayloadRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return { ...(payload as Record<string, unknown>) };
  }
  return {};
}

/**
 * Pull Billplz callback fields out of a webhook_events.payload that may also
 * contain retry-queue metadata written by WebhookRetryService.
 */
export function extractBillplzCallback(payload: unknown): BillplzCallback {
  const record = asPayloadRecord(payload);
  const nested = record.callback;
  const source =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : record;

  const callback: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!RETRY_META_KEY_SET.has(key) && key !== "callback") {
      callback[key] = value;
    }
  }
  return callback as BillplzCallback;
}

export function parseWebhookAmountCents(callback: BillplzCallback): number | null {
  const raw = callback.paid_amount ?? callback.amount;
  if (raw == null || raw === "") return null;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

/**
 * Billplz amounts are in the smallest currency unit (cents), matching
 * `payments.amount`. A missing webhook amount is treated as a match so
 * older/partial callbacks still confirm a locally recorded bill.
 */
export function amountsMatch(
  webhookAmountCents: number | null,
  localAmountCents: number,
): boolean {
  if (webhookAmountCents == null) return true;
  return webhookAmountCents === Number(localAmountCents);
}

export function isBillplzPaid(callback: BillplzCallback): boolean {
  if (callback.paid_at != null && String(callback.paid_at).trim() !== "") {
    const paidAt = String(callback.paid_at).trim().toLowerCase();
    if (paidAt !== "null" && paidAt !== "false") return true;
  }
  return callback.paid === true || callback.paid === "true" || callback.paid === "1";
}

export function parseBillplzPaidAt(callback: BillplzCallback, fallback: Date): Date {
  if (callback.paid_at != null && String(callback.paid_at).trim() !== "") {
    const parsed = new Date(String(callback.paid_at));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

export function classifyBookingPayment(input: {
  paymentAmountCents: number;
  bookingAmountMyr: number | string;
  depositAmountMyr?: number | string | null;
}): {
  kind: BookingPaymentKind;
  depositCents: number;
  remainingCents: number;
} {
  const bookingAmountMyr = Number(input.bookingAmountMyr);
  const explicitDeposit = Number(input.depositAmountMyr);
  const depositMyr =
    Number.isFinite(explicitDeposit) && explicitDeposit > 0
      ? explicitDeposit
      : bookingAmountMyr;
  const depositCents = Math.round(depositMyr * 100);
  const remainingCents = Math.round((bookingAmountMyr - depositMyr) * 100);
  const paymentAmountCents = Number(input.paymentAmountCents);

  if (paymentAmountCents === depositCents && remainingCents <= 0) {
    return { kind: "full", depositCents, remainingCents: Math.max(0, remainingCents) };
  }
  if (paymentAmountCents === depositCents) {
    return { kind: "deposit", depositCents, remainingCents };
  }
  if (remainingCents > 0 && paymentAmountCents === remainingCents) {
    return { kind: "remaining", depositCents, remainingCents };
  }
  return { kind: "unclassified", depositCents, remainingCents };
}

/**
 * Booking side effects after a payment is marked paid.
 *
 * Mirrors the historical webhook rules so reconcile and replay stay aligned:
 * deposit-like payments (including a full payment when no deposit is set)
 * stamp `secondPaymentDueDate` once; remaining-balance payments stamp
 * `remainingPaymentSent`.
 */
export function buildBookingPaymentUpdate(input: {
  kind: BookingPaymentKind;
  bookingDate: Date;
  existingSecondPaymentDueDate?: Date | null;
  now?: Date;
}): BookingPaymentUpdate {
  const now = input.now ?? new Date();
  const update: BookingPaymentUpdate = {
    status: "confirmed",
    updatedAt: now,
  };

  const isDepositLike = input.kind === "deposit" || input.kind === "full";
  if (isDepositLike && !input.existingSecondPaymentDueDate) {
    const secondPaymentDate = new Date(input.bookingDate);
    secondPaymentDate.setDate(secondPaymentDate.getDate() + 14);
    update.secondPaymentDueDate = secondPaymentDate;
  }

  if (input.kind === "remaining") {
    update.remainingPaymentSent = true;
  }

  return update;
}

export type BillplzPaymentWebhookResult =
  | {
      status: "processed";
      paymentId: number;
      bookingId: number | null;
      kind: BookingPaymentKind;
      transitioned: true;
    }
  | {
      status: "duplicate";
      paymentId: number;
      bookingId: number | null;
      kind: BookingPaymentKind;
      transitioned: false;
    }
  | { status: "ignored"; reason: "not_paid" | "missing_bill_id" }
  | { status: "no_payment"; billplzId: string }
  | {
      status: "amount_mismatch";
      paymentId: number;
      webhookAmount: number;
      localAmount: number;
    }
  | { status: "error"; error: string };

export function isSuccessfulWebhookReplay(result: BillplzPaymentWebhookResult): boolean {
  return (
    result.status === "processed" ||
    result.status === "duplicate" ||
    result.status === "ignored"
  );
}

export function isRetryableWebhookResult(result: BillplzPaymentWebhookResult): boolean {
  return result.status === "no_payment" || result.status === "error";
}

export function describeWebhookResult(result: BillplzPaymentWebhookResult): string {
  switch (result.status) {
    case "processed":
      return `Processed payment ${result.paymentId} (${result.kind})`;
    case "duplicate":
      return `Duplicate callback for payment ${result.paymentId}`;
    case "ignored":
      return `Ignored webhook (${result.reason})`;
    case "no_payment":
      return `No local payment for Billplz bill ${result.billplzId}`;
    case "amount_mismatch":
      return `Amount mismatch: webhook=${result.webhookAmount} local=${result.localAmount}`;
    case "error":
      return result.error;
  }
}
