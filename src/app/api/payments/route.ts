import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, payouts, muaBankAccounts, webhookEvents, bookings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { sendPaymentReceiptEmail } from "@/lib/email";

const billplz = prefixedEnvReader("BILLPLZ_");
const publicEnv = prefixedEnvReader("NEXT_PUBLIC_");

const BILLPLZ_API = billplz.get("API_URL");
const BASE_URL = publicEnv.get("URL") || "https://leish.my";

function billplzAuth() {
  return `Basic ${Buffer.from(billplz.require("API_KEY") + ":").toString("base64")}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const paymentId = searchParams.get("paymentId");

    if (action === "payouts" && userId) {
      const [payoutRows, bankRows] = await Promise.all([
        db.select().from(payouts).where(eq(payouts.userId, userId)),
        db
          .select()
          .from(muaBankAccounts)
          .where(eq(muaBankAccounts.userId, userId)),
      ]);

      const pendingBalance = payoutRows
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

      return NextResponse.json({
        payouts: payoutRows.map((p) => ({
          id: String(p.id),
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt?.toISOString() || "",
          updatedAt: p.updatedAt?.toISOString() || undefined,
        })),
        bankAccounts: bankRows.map((b) => ({
          id: String(b.id),
          bankName: b.bankName,
          accountNumber: b.accountNumber,
          accountHolder: b.accountHolder,
        })),
        pendingBalance,
      });
    }

    if (action === "status" && paymentId) {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, Number(paymentId)))
        .limit(1);

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      const result: any = { payment };

      if (payment.billplzId) {
        try {
          const billplzResponse = await fetch(
            `${BILLPLZ_API}/bills/${payment.billplzId}`,
            { headers: { Authorization: billplzAuth() } },
          );
          const billplzData = await billplzResponse.json();

          if (billplzData.paid_at) {
            await db
              .update(payments)
              .set({ status: "paid", updatedAt: new Date() })
              .where(eq(payments.id, Number(paymentId)));
            result.payment.status = "paid";
          }

          result.billplz = billplzData;
        } catch {
          // Billplz check failed, return what we have
        }
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json(
      { payouts: [], bankAccounts: [], pendingBalance: 0 },
      { status: 200 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "create-bill") {
      const { bookingId, amount, description, name, email, phone } = body;

      if (!bookingId || !amount) {
        return NextResponse.json(
          { error: "bookingId and amount required" },
          { status: 400 },
        );
      }

      const billplzBody = new URLSearchParams({
        collection_id: billplz.require("COLLECTION_ID"),
        description: description || "Beauty booking payment",
        amount: String(Math.round(Number(amount) * 100)),
        name: name || "Customer",
        email: email || "",
        phone: phone || "",
        callback_url: `${BASE_URL}/api/payments?action=webhook`,
        redirect_url: `${BASE_URL}/bookings/${bookingId}/success`,
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
        return NextResponse.json({ error: billplzData }, { status: billplzResponse.status });
      }

      const [payment] = await db
        .insert(payments)
        .values({
          bookingId: Number(bookingId),
          amount: Math.round(Number(amount)),
          status: "pending",
          billplzId: billplzData.id,
          method: "billplz",
        })
        .returning();

      return NextResponse.json({ bill: billplzData, payment }, { status: 201 });
    }

    if (action === "register-bank") {
      const { userId, bankName, accountNumber, accountHolder } = body;
      if (!userId || !bankName || !accountNumber || !accountHolder) {
        return NextResponse.json({ error: "All bank fields required" }, { status: 400 });
      }

      const [bank] = await db
        .insert(muaBankAccounts)
        .values({ userId, bankName, accountNumber, accountHolder })
        .returning();

      return NextResponse.json({ success: true, bank });
    }

    if (action === "release") {
      const { paymentId } = body;
      if (!paymentId) {
        return NextResponse.json({ error: "paymentId required" }, { status: 400 });
      }

      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, Number(paymentId)))
        .limit(1);

      if (!payment || payment.status !== "held") {
        return NextResponse.json(
          { error: "Payment not found or not in held status" },
          { status: 400 },
        );
      }

      await db
        .update(payments)
        .set({ status: "released", updatedAt: new Date() })
        .where(eq(payments.id, Number(paymentId)));

      return NextResponse.json({ success: true });
    }

    if (action === "refund") {
      const { paymentId } = body;
      if (!paymentId) {
        return NextResponse.json({ error: "paymentId required" }, { status: 400 });
      }

      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, Number(paymentId)))
        .limit(1);

      if (!payment || !payment.status || !["paid", "held"].includes(payment.status)) {
        return NextResponse.json(
          { error: "Payment not found or cannot be refunded" },
          { status: 400 },
        );
      }

      if (payment.billplzId) {
        const billplzResponse = await fetch(
          `${BILLPLZ_API}/bills/${payment.billplzId}/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: billplzAuth(),
            },
            body: JSON.stringify({ amount: payment.amount }),
          },
        );

        const billplzData = await billplzResponse.json();
        if (!billplzResponse.ok) {
          return NextResponse.json({ error: billplzData }, { status: billplzResponse.status });
        }
      }

      await db
        .update(payments)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(payments.id, Number(paymentId)));

      return NextResponse.json({ success: true });
    }

    if (action === "webhook") {
      const rawBody = await request.text();
      const signatureKey = billplz.get("SIGNATURE_KEY");

      if (signatureKey) {
        const signatureHeader = request.headers.get("x-signature") || "";
        const computedSignature = createHmac("sha256", signatureKey)
          .update(rawBody)
          .digest("hex");
        const computedBuf = Buffer.from(computedSignature, "utf-8");
        const headerBuf = Buffer.from(signatureHeader, "utf-8");

        if (
          computedBuf.length !== headerBuf.length ||
          !timingSafeEqual(computedBuf, headerBuf)
        ) {
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }

      const webhookBody = JSON.parse(rawBody);

      await db.insert(webhookEvents).values({
        event: "billplz.payment",
        payload: webhookBody,
      });

      if (webhookBody.id && webhookBody.paid_at) {
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.billplzId, webhookBody.id))
          .limit(1);

        await db
          .update(payments)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(payments.billplzId, webhookBody.id));

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
              const paidDate = new Date(webhookBody.paid_at).toLocaleDateString("en-MY", {
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
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
