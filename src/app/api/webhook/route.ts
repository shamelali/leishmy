import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEvents, payments, bookings, users, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { sendPaymentConfirmation } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

const billplz = prefixedEnvReader("BILLPLZ_");

export async function POST(request: NextRequest) {
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
    // Log rejected attempts so missed deliveries are visible instead of silent.
    // Truncate and strip PII (name/email/phone) before persisting.
    const bodyPreview = rawBody.slice(0, 150).replace(/email=[^&]*/gi, "email=redacted").replace(/name=[^&]*/gi, "name=redacted").replace(/phone=[^&]*/gi, "phone=redacted");
    await db
      .insert(webhookEvents)
      .values({
        event: "billplz.payment.rejected",
        payload: { reason: "invalid_signature", body: bodyPreview },
        status: "rejected",
      })
      .catch(() => {});
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    // Billplz delivers webhooks as application/x-www-form-urlencoded, but we
    // also accept JSON for local/testing. Normalize to an object either way.
    let body: Record<string, any>;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = JSON.parse(rawBody);
    } else {
      const params = new URLSearchParams(rawBody);
      body = Object.fromEntries(params.entries());
    }

    await db.insert(webhookEvents).values({
      event: "billplz.payment",
      payload: body,
      status: "received",
    });

    if (body.id && body.paid_at) {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.billplzId, body.id))
        .limit(1);

      if (payment) {
        const alreadyPaid = payment.status === "paid";

        // Verify the billed/captured amount matches what we recorded locally.
        // Billplz sends `amount`/`paid_amount` in the smallest currency unit
        // (cents), matching how we store `payments.amount`. If they diverge,
        // record an explicit event so it's visible in the webhook log instead
        // of silently confirming a booking for the wrong amount.
        const webhookAmount = body.paid_amount ?? body.amount;
        const amountMatches =
          webhookAmount == null ||
          Number(webhookAmount) === Number(payment.amount);

        if (!amountMatches) {
          await db
            .insert(webhookEvents)
            .values({
              event: "billplz.payment.amount_mismatch",
              payload: { ...body, localPaymentAmount: payment.amount },
              status: "mismatch",
            })
            .catch(() => {});
        }

        await db
          .update(payments)
          .set({ status: "paid", paidAt: new Date(body.paid_at), updatedAt: new Date() })
          .where(eq(payments.billplzId, body.id));

        if (alreadyPaid) {
          console.log(`[webhook] payment ${payment.id} already paid — skipping duplicate side effects`);
          return NextResponse.json({ success: true, duplicate: true });
        }

        if (payment.bookingId) {
          const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, payment.bookingId))
            .limit(1);

          if (booking) {
            const remainingAmount =
              Number(booking.amount) - (Number(booking.depositAmount) || 0);
            // payment.amount is stored in cents; booking.depositAmount and
            // remainingAmount are in MYR. Convert MYR to cents for comparison.
            const depositCents = Math.round((Number(booking.depositAmount) || 0) * 100);
            const remainingCents = Math.round(remainingAmount * 100);
            const isDepositPayment =
              Number(payment.amount) === depositCents;
            const isRemainingPayment =
              remainingCents > 0 &&
              Number(payment.amount) === remainingCents;

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

            if (booking.userId) {
              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, booking.userId))
                .limit(1);

              if (user) {
                const paidDate = new Date(body.paid_at).toLocaleDateString("en-MY", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                });

                await db.insert(notifications).values({
                  userId: booking.userId,
                  type: "booking_confirmed",
                  title: "Booking Confirmed",
                  body: `Your booking #${payment.bookingId} has been confirmed. Payment of MYR ${(Number(payment.amount) / 100).toLocaleString()} received.`,
                  data: { link: `/bookings/${payment.bookingId}`, bookingId: String(payment.bookingId) },
                }).catch(() => {});

                if (booking.artistId) {
                  await db.insert(notifications).values({
                    userId: booking.artistId,
                    type: "booking_confirmed",
                    title: "Payment Received — Booking Confirmed",
                    body: `Payment received for booking #${payment.bookingId}. The appointment is now confirmed.`,
                    data: { link: `/bookings/${payment.bookingId}`, bookingId: String(payment.bookingId) },
                  }).catch(() => {});
                }

                sendPaymentReceiptEmail({
                  email: user.email,
                  customerName: user.name || "Valued Customer",
                  bookingId: String(payment.bookingId),
                  amount: Number(payment.amount),
                  paymentMethod: "Billplz",
                  date: paidDate,
                }).catch((err) => console.error("sendPaymentReceiptEmail failed:", err));

                if (user.phone) {
                  sendPaymentConfirmation({
                    customerName: user.name || "Valued Customer",
                    bookingId: String(payment.bookingId),
                    amount: Number(payment.amount) / 100,
                    phone: user.phone,
                  }).catch((err) => console.error("sendPaymentConfirmation WhatsApp failed:", err));
                }
              }
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    }
    } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
