import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampDepositPercent,
  depositCentsFromTotal,
  fromCents,
  myrString,
  remainingCents,
  remainingMyr,
  toCents,
} from "./money";
import { isRetryableTxError, isUniqueViolation, txBackoffMs } from "./db-utils";
import { createBookingSchema, addQuoteSchema } from "./validations/bookings";

describe("money helpers", () => {
  it("rounds to integer cents without floating-point drift", () => {
    assert.equal(toCents(10.1), 1010);
    assert.equal(toCents("3.03"), 303);
    assert.equal(toCents(0.1 + 0.2), 30);
    assert.equal(toCents(null), 0);
    assert.equal(toCents("not-a-number"), 0);
  });

  it("converts cents back to MYR", () => {
    assert.equal(fromCents(1010), 10.1);
    assert.equal(myrString(303), "3.03");
    assert.equal(myrString(1), "0.01");
  });

  it("computes remaining balance in cents", () => {
    assert.equal(remainingCents(10.1, 3.03), 707);
    assert.equal(remainingMyr(10.1, 3.03), 7.07);
    assert.equal(remainingCents(100, 150), 0);
  });

  it("clamps deposit percent and computes deposit cents", () => {
    assert.equal(clampDepositPercent(5), 10);
    assert.equal(clampDepositPercent(250), 100);
    assert.equal(clampDepositPercent(undefined), 30);
    assert.equal(depositCentsFromTotal(10_000, 30), 3000);
    assert.equal(depositCentsFromTotal(9999, 30), 3000);
  });
});

describe("transaction error classification", () => {
  it("retries serialization failures and deadlocks", () => {
    assert.equal(isRetryableTxError({ code: "40001" }), true);
    assert.equal(isRetryableTxError({ code: "40P01" }), true);
    assert.equal(isRetryableTxError(new Error("could not serialize access due to concurrent update")), true);
    assert.equal(isRetryableTxError({ code: "23505" }), false);
  });

  it("detects unique violations", () => {
    assert.equal(isUniqueViolation({ code: "23505" }), true);
    assert.equal(isUniqueViolation({ cause: { code: "23505" } }), true);
    assert.equal(isUniqueViolation({ code: "40001" }), false);
  });

  it("caps exponential backoff", () => {
    const first = txBackoffMs(0);
    const later = txBackoffMs(10);
    assert.ok(first >= 100 && first <= 150);
    assert.ok(later >= 800 && later <= 850);
  });
});

describe("createBookingSchema", () => {
  it("requires a future date and a provider", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const ok = createBookingSchema.safeParse({
      artistId: "artist-1",
      date: future,
      clientEmail: "a@b.com",
      time: "9:00 AM",
    });
    assert.equal(ok.success, true);

    const past = createBookingSchema.safeParse({
      artistId: "artist-1",
      date: "2020-01-01",
    });
    assert.equal(past.success, false);

    const noProvider = createBookingSchema.safeParse({
      date: future,
      clientEmail: "a@b.com",
    });
    assert.equal(noProvider.success, false);

    const badPhone = createBookingSchema.safeParse({
      artistId: "artist-1",
      date: future,
      phone: "drop table;",
    });
    assert.equal(badPhone.success, false);
  });

  it("accepts MYR discounts above 50 (capped later in cents)", () => {
    const parsed = addQuoteSchema.safeParse({
      bookingId: 1,
      servicePrice: 500,
      discount: 100,
    });
    assert.equal(parsed.success, true);
  });
});
