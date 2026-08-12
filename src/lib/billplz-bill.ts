import { db } from "@/db";
import { payments, bookings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { prefixedEnvReader } from "@/lib/env-prefix";

const billplz = prefixedEnvReader("BILLPLZ_");
const publicEnv = prefixedEnvReader("NEXT_PUBLIC_");

const BILLPLZ_API = billplz.get("API_URL");
const BASE_URL = publicEnv.get("URL") || "https://leish.my";

function billplzAuth() {
  return `Basic ${Buffer.from(billplz.require("API_KEY") + ":").toString("base64")}`;
}

export interface CreateBillOptions {
  bookingId: number;
  description?: string;
  name?: string;
  email?: string;
  phone?: string;
  idempotencyKey?: string;
  redirectUrl?: string;
  /** Amount in MYR. Defaults to the booking deposit (or full amount). */
  amount?: number;
}

export interface CreateBillResult {
  bill: { id: string; url?: string };
  payment: typeof payments.$inferSelect;
  cached?: boolean;
}

function cachedBill(billplzId: string | null): CreateBillResult["bill"] {
  const id = billplzId ?? "";
  if (!id) return { id };

  const apiUrl = BILLPLZ_API || "https://www.billplz.com/api/v3";
  const origin = new URL(apiUrl).origin;
  return { id, url: `${origin}/bills/${encodeURIComponent(id)}` };
}

/**
 * Create a Billplz bill for a booking. Handles idempotency, validation,
 * API call, and payment row insertion. Shared between the accept-quote route
 * and the /api/payments create-bill action.
 */
export async function createBillForBooking(
  opts: CreateBillOptions,
): Promise<{ ok: true; data: CreateBillResult } | { ok: false; status: number; error: string }> {
  const { bookingId, description, name, email, phone, idempotencyKey, redirectUrl, amount } = opts;

  // Idempotency: prevent duplicate bill creation on retry
  if (idempotencyKey) {
    const [existing] = await db
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing && existing.bookingId !== bookingId) {
      return {
        ok: false,
        status: 409,
        error: "Idempotency key is already associated with another booking",
      };
    }

    if (existing && existing.status !== "pending") {
      return {
        ok: true,
        data: { bill: cachedBill(existing.billplzId), payment: existing, cached: true },
      };
    }

    if (existing && existing.status === "pending") {
      // Check if the booking was cancelled since the payment was created
      const [linkedBooking] = await db
        .select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (linkedBooking && linkedBooking.status === "cancelled") {
        // Stale payment for cancelled booking — mark it failed and allow new payment
        await db
          .update(payments)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(payments.id, existing.id));
      } else {
        // Still valid pending payment — return cached
        return {
          ok: true,
          data: { bill: cachedBill(existing.billplzId), payment: existing, cached: true },
        };
      }
    }
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }

  // Reuse a pending bill for this booking instead of creating a duplicate.
  const [existingPending] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.status, "pending"),
      ),
    )
    .limit(1);

  if (existingPending && booking.status !== "cancelled") {
    return {
      ok: true,
      data: {
        bill: cachedBill(existingPending.billplzId),
        payment: existingPending,
        cached: true,
      },
    };
  }

  // Clean up stale pending payment if booking was cancelled
  if (existingPending && booking.status === "cancelled") {
    await db
      .update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payments.id, existingPending.id));
  }

  const depositAmount = booking.depositAmount
    ? Number(booking.depositAmount)
    : Number(booking.amount);
  const realAmount = amount ?? depositAmount;
  if (!realAmount || realAmount < 1 || isNaN(realAmount)) {
    return { ok: false, status: 400, error: "Booking amount is invalid" };
  }

  const milestoneLabel = booking.milestone
    ? booking.milestone === "deposit_50"
      ? " (50% deposit)"
      : booking.milestone === "deposit_30"
        ? " (30% deposit)"
        : " (full payment)"
    : "";

  const billplzBody = new URLSearchParams({
    collection_id: billplz.require("COLLECTION_ID"),
    description: `${description || "Beauty booking payment"}${milestoneLabel}`,
    amount: String(Math.round(realAmount * 100)),
    name: name || "Customer",
    email: email || "",
    phone: phone || "",
    callback_url: `${BASE_URL}/api/webhook`,
    redirect_url: redirectUrl || `${BASE_URL}/bookings/${bookingId}/success`,
  });

  const billplzResponse = await fetch(`${BILLPLZ_API}/bills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: billplzAuth(),
    },
    body: billplzBody,
  });

  const billplzData = await billplzResponse.json();

  if (!billplzResponse.ok) {
    return { ok: false, status: billplzResponse.status, error: JSON.stringify(billplzData) };
  }

  const [payment] = await db
    .insert(payments)
    .values({
      bookingId,
      amount: Math.round(realAmount * 100),
      status: "pending",
      billplzId: billplzData.id,
      method: "billplz",
      idempotencyKey: idempotencyKey || null,
    })
    .returning();

  return {
    ok: true,
    data: { bill: billplzData, payment },
  };
}
