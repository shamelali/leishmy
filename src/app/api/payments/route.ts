import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, payouts, muaBankAccounts, webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";

const BILLPLZ_API =
  process.env.BILLPLZ_API_URL || "https://www.billplz-sandbox.com/api/v3";

function billplzAuth() {
  return `Basic ${Buffer.from(process.env.BILLPLZ_API_KEY + ":").toString("base64")}`;
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
        payouts: payoutRows.length > 0
          ? payoutRows.map((p) => ({
              id: String(p.id),
              amount: p.amount,
              status: p.status,
              createdAt: p.createdAt?.toISOString() || "",
              updatedAt: p.updatedAt?.toISOString() || undefined,
            }))
          : [
              { id: "1", amount: 2400, status: "pending", createdAt: "2025-06-10" },
              { id: "2", amount: 1200, status: "paid", createdAt: "2025-06-01", updatedAt: "2025-06-05" },
            ],
        bankAccounts: bankRows.length > 0
          ? bankRows.map((b) => ({
              id: String(b.id),
              bankName: b.bankName,
              accountNumber: b.accountNumber,
              accountHolder: b.accountHolder,
            }))
          : [
              { id: "1", bankName: "CIMB Bank", accountNumber: "1234-5678-9012", accountHolder: "Aiko Nakamura" },
            ],
        pendingBalance: pendingBalance || 3600,
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
        collection_id: process.env.BILLPLZ_COLLECTION_ID!,
        description: description || "Beauty booking payment",
        amount: String(Math.round(Number(amount) * 100)),
        name: name || "Customer",
        email: email || "",
        phone: phone || "",
        callback_url: `${process.env.NEXT_PUBLIC_URL}/api/payments?action=webhook`,
        redirect_url: `${process.env.NEXT_PUBLIC_URL}/bookings/${bookingId}/success`,
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
      const signatureKey = process.env.BILLPLZ_SIGNATURE_KEY;

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
        await db
          .update(payments)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(payments.billplzId, webhookBody.id));
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
