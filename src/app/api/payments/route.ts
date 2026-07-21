import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, payouts, bookings, profiles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { rateLimitApi } from "@/lib/rate-limit-api";

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

    if (action === "history" && userId) {
      const session = await getAuthSession();
      if (!session || session.id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const artistUsers = alias(users, "artist_users");
      const rows = await db
        .select({
          id: payments.id,
          amount: payments.amount,
          status: payments.status,
          method: payments.method,
          createdAt: payments.createdAt,
          bookingId: payments.bookingId,
          artistName: artistUsers.name,
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
        .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
        .where(eq(bookings.userId, userId))
        .orderBy(payments.createdAt);

      return NextResponse.json({
        payments: rows.map((p) => ({
          id: String(p.id),
          amount: p.amount,
          status: p.status || "pending",
          method: p.method || "billplz",
          createdAt: p.createdAt?.toISOString() || "",
          bookingId: String(p.bookingId || ""),
          artistName: p.artistName || "",
        })),
      });
    }

    if (action === "payouts" && userId) {
      const session = await getAuthSession();
      if (!session || session.id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const [payoutRows, bankProfiles] = await Promise.all([
        db.select().from(payouts).where(eq(payouts.userId, userId)),
        db
          .select({
            userId: profiles.userId,
            bankName: profiles.bankName,
            accountNumber: profiles.accountNumber,
            accountHolder: profiles.accountHolder,
          })
          .from(profiles)
          .where(eq(profiles.userId, userId)),
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
        bankAccounts: bankProfiles
          .filter((b) => b.bankName)
          .map((b) => ({
            id: b.userId,
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

            if (payment.bookingId) {
              await db
                .update(bookings)
                .set({ status: "completed", updatedAt: new Date() })
                .where(eq(bookings.id, payment.bookingId));
              result.payment.bookingStatus = "completed";
            }
          }

          result.billplz = billplzData;
        } catch {
          console.error("Billplz check failed for payment", paymentId);
        }
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limit all payment mutations
  const rateLimit = await rateLimitApi(request, { max: 30, window: 60 });
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "create-bill") {
      const session = await getAuthSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { bookingId, description, name, email, phone, idempotencyKey } = body;

      if (!bookingId) {
        return NextResponse.json(
          { error: "bookingId is required" },
          { status: 400 },
        );
      }

      // Idempotency: prevent duplicate bill creation on retry
      if (idempotencyKey) {
        const [existing] = await db
          .select()
          .from(payments)
          .where(eq(payments.idempotencyKey, idempotencyKey))
          .limit(1);

        if (existing) {
          return NextResponse.json(
            { bill: { id: existing.billplzId }, payment: existing, cached: true },
            { status: 200 }
          );
        }
      }

      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(bookingId)))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      if (!hasAdminAccess(session) && booking.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Prevent duplicate pending payments for same booking
      const [existingPending] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.bookingId, Number(bookingId)),
            eq(payments.status, "pending")
          )
        )
        .limit(1);

      if (existingPending) {
        return NextResponse.json(
          { 
            error: "A pending payment already exists for this booking",
            payment: existingPending 
          },
          { status: 409 }
        );
      }

      const realAmount = Number(booking.amount);
      if (!realAmount || realAmount < 1 || isNaN(realAmount)) {
        return NextResponse.json(
          { error: "Booking amount is invalid" },
          { status: 400 },
        );
      }

      const billplzBody = new URLSearchParams({
        collection_id: billplz.require("COLLECTION_ID"),
        description: description || "Beauty booking payment",
        amount: String(Math.round(realAmount * 100)),
        name: name || "Customer",
        email: email || "",
        phone: phone || "",
        callback_url: `${BASE_URL}/api/webhook`,
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
          amount: Math.round(realAmount * 100),
          status: "pending",
          billplzId: billplzData.id,
          method: "billplz",
          idempotencyKey: idempotencyKey || null,
        })
        .returning();

      return NextResponse.json({ bill: billplzData, payment }, { status: 201 });
    }

    if (action === "register-bank") {
      const session = await getAuthSession();
      const { userId, bankName, accountNumber, accountHolder } = body;
      if (!session || session.id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!userId || !bankName || !accountNumber || !accountHolder) {
        return NextResponse.json({ error: "All bank fields required" }, { status: 400 });
      }

      const [bank] = await db
        .update(profiles)
        .set({ bankName, accountNumber, accountHolder })
        .where(eq(profiles.userId, userId))
        .returning({
          id: profiles.userId,
          bankName: profiles.bankName,
          accountNumber: profiles.accountNumber,
          accountHolder: profiles.accountHolder,
        });

      return NextResponse.json({ success: true, bank });
    }

    if (action === "release") {
      const session = await getAuthSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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
      const session = await getAuthSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
