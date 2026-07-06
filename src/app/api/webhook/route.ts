import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEvents, payments, bookings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { sendPaymentReceiptEmail } from "@/lib/email";

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
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

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

      await db
        .update(payments)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(payments.billplzId, body.id));

      if (payment?.bookingId) {
        const [booking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .limit(1);

        if (booking?.userId) {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, booking.userId))
            .limit(1);

          if (user) {
            const paidDate = new Date(body.paid_at).toLocaleDateString("en-MY", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            });

            sendPaymentReceiptEmail({
              email: user.email,
              customerName: user.name || "Valued Customer",
              bookingId: String(payment.bookingId),
              amount: Number(payment.amount),
              paymentMethod: "Billplz",
              date: paidDate,
            }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
