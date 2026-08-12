import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  amountsMatch,
  buildBookingPaymentUpdate,
  classifyBookingPayment,
  extractBillplzCallback,
  isBillplzPaid,
  parseWebhookAmountCents,
} from "@/lib/billplz-payment";
import {
  processBillplzPaymentWebhook,
  type BillplzPaymentWebhookStore,
  type BookingRow,
  type NotificationInsert,
  type PaymentRow,
  type UserRow,
} from "@/lib/billplz-payment-webhook";

class MemoryBillplzStore implements BillplzPaymentWebhookStore {
  payments = new Map<string, PaymentRow & { paidAt?: Date }>();
  bookings = new Map<number, BookingRow>();
  users = new Map<string, UserRow>();
  notifications: NotificationInsert[] = [];
  private lock: Promise<void> = Promise.resolve();

  private async withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    let release!: () => void;
    const previous = this.lock;
    this.lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  seedPayment(payment: PaymentRow) {
    if (!payment.billplzId) throw new Error("billplzId required");
    this.payments.set(payment.billplzId, { ...payment });
  }

  seedBooking(booking: BookingRow) {
    this.bookings.set(booking.id, { ...booking });
  }

  seedUser(user: UserRow) {
    this.users.set(user.id, { ...user });
  }

  getPayment(billplzId: string) {
    return this.payments.get(billplzId);
  }

  getBooking(id: number) {
    return this.bookings.get(id);
  }

  async applyPaidCallback(input: {
    billplzId: string;
    paidAt: Date;
    now: Date;
    webhookAmountCents: number | null;
  }) {
    return this.withLock(() => {
      const payment = this.payments.get(input.billplzId);
      if (!payment) return { status: "no_payment" as const, billplzId: input.billplzId };

      if (!amountsMatch(input.webhookAmountCents, payment.amount)) {
        return {
          status: "amount_mismatch" as const,
          payment,
          webhookAmount: Number(input.webhookAmountCents),
          localAmount: Number(payment.amount),
        };
      }

      const booking = payment.bookingId ? this.bookings.get(payment.bookingId) ?? null : null;
      const kind = booking
        ? classifyBookingPayment({
            paymentAmountCents: payment.amount,
            bookingAmountMyr: booking.amount,
            depositAmountMyr: booking.depositAmount,
          }).kind
        : "unclassified";

      if (payment.status === "paid") {
        return {
          status: "duplicate" as const,
          payment,
          booking,
          kind,
          transitioned: false as const,
        };
      }

      payment.status = "paid";
      payment.paidAt = input.paidAt;

      if (booking) {
        const update = buildBookingPaymentUpdate({
          kind,
          bookingDate: booking.date,
          existingSecondPaymentDueDate: booking.secondPaymentDueDate,
          now: input.now,
        });
        Object.assign(booking, update);
      }

      return {
        status: "processed" as const,
        payment,
        booking,
        kind,
        transitioned: true as const,
      };
    });
  }

  async findUser(id: string) {
    return this.users.get(id) ?? null;
  }

  async insertNotification(notification: NotificationInsert) {
    this.notifications.push(notification);
  }
}

function fixture(overrides?: {
  paymentAmount?: number;
  bookingAmount?: number;
  depositAmount?: number | null;
  paymentStatus?: string;
}) {
  const store = new MemoryBillplzStore();
  const bookingDate = new Date("2026-09-01T02:00:00.000Z");
  store.seedUser({
    id: "user-1",
    email: "client@example.com",
    name: "Aina",
    phone: "0123456789",
  });
  store.seedUser({
    id: "artist-1",
    email: "artist@example.com",
    name: "Mira",
    phone: "0190000000",
  });
  store.seedBooking({
    id: 10,
    userId: "user-1",
    artistId: "artist-1",
    amount: overrides?.bookingAmount ?? 500,
    depositAmount: overrides?.depositAmount === undefined ? 150 : overrides.depositAmount,
    date: bookingDate,
    secondPaymentDueDate: null,
    remainingPaymentSent: false,
    status: "pending",
  });
  store.seedPayment({
    id: 20,
    bookingId: 10,
    amount: overrides?.paymentAmount ?? 15000,
    status: overrides?.paymentStatus ?? "pending",
    billplzId: "bill_deposit",
    method: "billplz",
  });
  return store;
}

function callback(overrides: Record<string, unknown> = {}) {
  return {
    id: "bill_deposit",
    paid: "true",
    paid_at: "2026-08-12 12:00:00 +0800",
    amount: "15000",
    paid_amount: "15000",
    ...overrides,
  };
}

describe("Billplz payment helpers", () => {
  it("parses webhook amounts and matches local cents", () => {
    assert.equal(parseWebhookAmountCents({ paid_amount: "15000" }), 15000);
    assert.equal(parseWebhookAmountCents({ amount: 15000 }), 15000);
    assert.equal(parseWebhookAmountCents({}), null);
    assert.equal(amountsMatch(15000, 15000), true);
    assert.equal(amountsMatch(14000, 15000), false);
    assert.equal(amountsMatch(null, 15000), true);
  });

  it("classifies deposit, remaining, and full payments", () => {
    assert.equal(
      classifyBookingPayment({
        paymentAmountCents: 15000,
        bookingAmountMyr: 500,
        depositAmountMyr: 150,
      }).kind,
      "deposit",
    );
    assert.equal(
      classifyBookingPayment({
        paymentAmountCents: 35000,
        bookingAmountMyr: 500,
        depositAmountMyr: 150,
      }).kind,
      "remaining",
    );
    assert.equal(
      classifyBookingPayment({
        paymentAmountCents: 50000,
        bookingAmountMyr: 500,
        depositAmountMyr: null,
      }).kind,
      "full",
    );
    assert.equal(
      classifyBookingPayment({
        paymentAmountCents: 999,
        bookingAmountMyr: 500,
        depositAmountMyr: 150,
      }).kind,
      "unclassified",
    );
  });

  it("builds booking updates for deposit and remaining payments", () => {
    const bookingDate = new Date("2026-09-01T00:00:00.000Z");
    const deposit = buildBookingPaymentUpdate({
      kind: "deposit",
      bookingDate,
      existingSecondPaymentDueDate: null,
      now: new Date("2026-08-12T00:00:00.000Z"),
    });
    assert.equal(deposit.status, "confirmed");
    assert.equal(deposit.secondPaymentDueDate?.toISOString(), "2026-09-15T00:00:00.000Z");
    assert.equal(deposit.remainingPaymentSent, undefined);

    const remaining = buildBookingPaymentUpdate({
      kind: "remaining",
      bookingDate,
      existingSecondPaymentDueDate: new Date("2026-09-15T00:00:00.000Z"),
      now: new Date("2026-08-20T00:00:00.000Z"),
    });
    assert.equal(remaining.remainingPaymentSent, true);
    assert.equal(remaining.secondPaymentDueDate, undefined);
  });

  it("does not schedule a second payment for a full upfront payment", () => {
    const bookingDate = new Date("2026-09-01T00:00:00.000Z");
    const full = buildBookingPaymentUpdate({
      kind: "full",
      bookingDate,
      existingSecondPaymentDueDate: null,
      now: new Date("2026-08-12T00:00:00.000Z"),
    });
    assert.equal(full.status, "confirmed");
    assert.equal(full.secondPaymentDueDate, undefined);
    assert.equal(full.remainingPaymentSent, undefined);
  });

  it("strips retry metadata from mixed webhook payloads", () => {
    const callback = extractBillplzCallback({
      id: "bill_1",
      paid_at: "2026-08-12",
      retryCount: 2,
      lastError: "boom",
      nextRetryAt: "2026-08-12T00:00:00.000Z",
    });
    assert.equal(callback.id, "bill_1");
    assert.equal(callback.paid_at, "2026-08-12");
    assert.equal("retryCount" in callback, false);
    assert.equal("lastError" in callback, false);
  });

  it("treats paid_at or paid=true as a paid callback", () => {
    assert.equal(isBillplzPaid({ paid_at: "2026-08-12 12:00:00 +0800" }), true);
    assert.equal(isBillplzPaid({ paid: "true" }), true);
    assert.equal(isBillplzPaid({ paid: "false" }), false);
    assert.equal(isBillplzPaid({ id: "bill_1" }), false);
  });
});

describe("processBillplzPaymentWebhook", () => {
  it("marks a deposit paid, confirms the booking, and notifies once", async () => {
    const store = fixture();
    const emails: string[] = [];
    const whatsapp: string[] = [];

    const result = await processBillplzPaymentWebhook(callback(), {
      store,
      sendPaymentReceiptEmail: async (params) => {
        emails.push(params.email);
        return { success: true };
      },
      sendPaymentConfirmation: async (params) => {
        whatsapp.push(params.phone);
        return { success: true };
      },
      trackPaymentEvent: async () => {},
      recordAmountMismatch: async () => {},
      now: () => new Date("2026-08-12T04:00:00.000Z"),
    });

    assert.equal(result.status, "processed");
    if (result.status !== "processed") return;
    assert.equal(result.kind, "deposit");
    assert.equal(result.transitioned, true);
    assert.equal(store.getPayment("bill_deposit")?.status, "paid");
    const booking = store.getBooking(10);
    assert.equal(booking?.status, "confirmed");
    assert.equal(booking?.secondPaymentDueDate?.toISOString(), "2026-09-15T02:00:00.000Z");
    assert.equal(booking?.remainingPaymentSent, false);
    assert.equal(store.notifications.length, 2);
    assert.deepEqual(emails, ["client@example.com"]);
    assert.deepEqual(whatsapp, ["0123456789"]);
  });

  it("marks remaining balance received without resetting the deposit due date", async () => {
    const store = fixture({ paymentAmount: 35000 });
    store.seedPayment({
      id: 21,
      bookingId: 10,
      amount: 35000,
      status: "pending",
      billplzId: "bill_remaining",
      method: "billplz",
    });
    const existingDue = new Date("2026-09-15T02:00:00.000Z");
    const booking = store.getBooking(10);
    if (booking) booking.secondPaymentDueDate = existingDue;

    const result = await processBillplzPaymentWebhook(
      callback({
        id: "bill_remaining",
        amount: "35000",
        paid_amount: "35000",
      }),
      {
        store,
        sendPaymentReceiptEmail: async () => ({ success: true }),
        sendPaymentConfirmation: async () => ({ success: true }),
        trackPaymentEvent: async () => {},
        recordAmountMismatch: async () => {},
      },
    );

    assert.equal(result.status, "processed");
    if (result.status !== "processed") return;
    assert.equal(result.kind, "remaining");
    assert.equal(store.getBooking(10)?.remainingPaymentSent, true);
    assert.equal(store.getBooking(10)?.secondPaymentDueDate?.toISOString(), existingDue.toISOString());
  });

  it("is idempotent for duplicate callbacks", async () => {
    const store = fixture();
    let emails = 0;
    const deps = {
      store,
      sendPaymentReceiptEmail: async () => {
        emails += 1;
        return { success: true };
      },
      sendPaymentConfirmation: async () => ({ success: true }),
      trackPaymentEvent: async () => {},
      recordAmountMismatch: async () => {},
    };

    const first = await processBillplzPaymentWebhook(callback(), deps);
    const second = await processBillplzPaymentWebhook(callback(), deps);

    assert.equal(first.status, "processed");
    assert.equal(second.status, "duplicate");
    assert.equal(store.getPayment("bill_deposit")?.status, "paid");
    assert.equal(emails, 1);
    assert.equal(store.notifications.length, 2);
  });

  it("rejects amount mismatches without marking the payment paid", async () => {
    const store = fixture();
    let mismatchRecorded = false;

    const result = await processBillplzPaymentWebhook(
      callback({ paid_amount: "14000", amount: "14000" }),
      {
        store,
        sendPaymentReceiptEmail: async () => ({ success: true }),
        sendPaymentConfirmation: async () => ({ success: true }),
        trackPaymentEvent: async () => {},
        recordAmountMismatch: async () => {
          mismatchRecorded = true;
        },
      },
    );

    assert.equal(result.status, "amount_mismatch");
    assert.equal(store.getPayment("bill_deposit")?.status, "pending");
    assert.equal(store.getBooking(10)?.status, "pending");
    assert.equal(mismatchRecorded, true);
    assert.equal(store.notifications.length, 0);
  });

  it("returns a retryable no_payment result when the bill is unknown", async () => {
    const store = fixture();
    const result = await processBillplzPaymentWebhook(callback({ id: "missing_bill" }), {
      store,
      sendPaymentReceiptEmail: async () => ({ success: true }),
      sendPaymentConfirmation: async () => ({ success: true }),
      trackPaymentEvent: async () => {},
      recordAmountMismatch: async () => {},
    });
    assert.deepEqual(result, { status: "no_payment", billplzId: "missing_bill" });
    assert.equal(store.getPayment("bill_deposit")?.status, "pending");
  });

  it("ignores unpaid callbacks", async () => {
    const store = fixture();
    const result = await processBillplzPaymentWebhook(
      { id: "bill_deposit", paid: "false" },
      {
        store,
        sendPaymentReceiptEmail: async () => ({ success: true }),
        sendPaymentConfirmation: async () => ({ success: true }),
        trackPaymentEvent: async () => {},
        recordAmountMismatch: async () => {},
      },
    );
    assert.deepEqual(result, { status: "ignored", reason: "not_paid" });
    assert.equal(store.getPayment("bill_deposit")?.status, "pending");
  });

  it("lets only one concurrent worker transition the same payment", async () => {
    const store = fixture();
    const deps = {
      store,
      sendPaymentReceiptEmail: async () => ({ success: true }),
      sendPaymentConfirmation: async () => ({ success: true }),
      trackPaymentEvent: async () => {},
      recordAmountMismatch: async () => {},
    };

    const [a, b] = await Promise.all([
      processBillplzPaymentWebhook(callback(), deps),
      processBillplzPaymentWebhook(callback(), deps),
    ]);

    const statuses = [a.status, b.status].sort();
    assert.deepEqual(statuses, ["duplicate", "processed"]);
    assert.equal(store.getPayment("bill_deposit")?.status, "paid");
    assert.equal(store.notifications.length, 2);
  });
});
