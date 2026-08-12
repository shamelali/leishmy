import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, payouts, bookings, profiles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { rateLimitApi } from "@/lib/rate-limit-api";
import { sendPaymentConfirmation } from "@/lib/notifications/whatsapp";
import { createBillSchema, registerBankSchema, createRemainingBillSchema, qrPaymentSchema, releasePaymentSchema, refundPaymentSchema } from "@/lib/validations/payments";
import { createBillForBooking } from "@/lib/billplz-bill";
import { reconcilePayment } from "@/lib/payment-reconcile";
import { PaymentAnalytics } from "@/lib/payment-analytics";

const billplz = prefixedEnvReader("BILLPLZ_");
const publicEnv = prefixedEnvReader("NEXT_PUBLIC_");

const BILLPLZ_API = billplz.get("API_URL");
const BASE_URL = publicEnv.get("URL") || "https://leish.my";

function billplzAuth() {
  return `Basic ${Buffer.from(billplz.require("API_KEY") + ":").toString("base64")}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const paymentId = searchParams.get("paymentId");

     if (action === "history" && userId) {
       if (!session || session.id !== userId) {
         // Track unauthorized payment history access
         await PaymentAnalytics.trackPaymentEvent("payment_history_access_unauthorized", 0, {
           requestedUserId: userId,
           authenticatedUserId: session?.id ?? null
         });
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
       }

        // Track payment history access
        await PaymentAnalytics.trackPaymentEvent("payment_history_access", Number(userId), {
          userId: Number(userId)
        });

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

        // Track payment history analytics
        await PaymentAnalytics.trackPaymentEvent("payment_history_data_retrieved", Number(userId), {
          userId: Number(userId),
          paymentCount: rows.length,
          paidPayments: rows.filter(p => p.status === "paid").length,
          pendingPayments: rows.filter(p => p.status === "pending").length,
          failedPayments: rows.filter(p => p.status === "failed").length
        });

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
         // Track unauthorized payouts access
         await PaymentAnalytics.trackPaymentEvent("payouts_access_unauthorized", 0, {
           requestedUserId: userId,
           authenticatedUserId: session?.id ?? null
         });
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
       }

        // Track payouts access
        await PaymentAnalytics.trackPaymentEvent("payouts_access", Number(userId), {
          userId: Number(userId)
        });

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
         .reduce(
           (sum, p) =>
             sum + (p.netAmount ?? (p.amount - (p.commissionAmount ?? 0))),
           0,
         ) / 100;

        // Track payouts analytics
        await PaymentAnalytics.trackPaymentEvent("payouts_data_retrieved", Number(userId), {
          userId: Number(userId),
          totalPayouts: payoutRows.length,
          pendingPayouts: payoutRows.filter(p => p.status === "pending").length,
          paidPayouts: payoutRows.filter(p => p.status === "paid").length,
          pendingBalance
        });

       return NextResponse.json({
         payouts: payoutRows.map((p) => ({
           id: String(p.id),
           // payouts.amount is stored in cents; return MYR like pendingBalance
           // so dashboards render the same unit throughout.
           amount: (p.amount ?? 0) / 100,
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
         // Track payment status request for non-existent payment
         await PaymentAnalytics.trackPaymentEvent("payment_status_not_found", 0, {
           paymentId: Number(paymentId)
         });
         return NextResponse.json({ error: "Payment not found" }, { status: 404 });
       }

       if (!session) {
         // Track unauthorized payment status request
         await PaymentAnalytics.trackPaymentEvent("payment_status_unauthorized", payment.id, {
           paymentId: payment.id
         });
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
       }

       if (!hasAdminAccess(session) && payment.bookingId) {
         const [owner] = await db
           .select({ userId: bookings.userId })
           .from(bookings)
           .where(eq(bookings.id, payment.bookingId))
           .limit(1);
         if (owner && owner.userId !== session.id) {
           // Track forbidden payment status request (wrong user)
           await PaymentAnalytics.trackPaymentEvent("payment_status_forbidden_wrong_user", payment.id, {
             paymentId: payment.id,
             requestedBy: session.id,
             paymentOwner: owner.userId
           });
           return NextResponse.json({ error: "Forbidden" }, { status: 403 });
         }
       }

       if (!hasAdminAccess(session) && !payment.bookingId) {
         // Track forbidden payment status request (non-admin trying to access non-booking payment)
         await PaymentAnalytics.trackPaymentEvent("payment_status_forbidden_non_admin", payment.id, {
           paymentId: payment.id,
           userRole: session.role ?? "unknown"
         });
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
       }

       // Track payment status request
       await PaymentAnalytics.trackPaymentEvent("payment_status_request", payment.id, {
         paymentId: payment.id,
         userId: session.id,
         isAdmin: hasAdminAccess(session)
       });

       const result = await reconcilePayment(Number(paymentId));
       const { billplzId } = result;
       const billplzData = billplzId
         ? (async () => {
             try {
               const res = await fetch(`${BILLPLZ_API}/bills/${billplzId}`, {
                 headers: { Authorization: billplzAuth() },
               });
               return await res.json();
             } catch {
               return null;
             }
           })()
         : null;

       // Track payment reconciliation result
       await PaymentAnalytics.trackPaymentEvent("payment_reconciliation", payment.id, {
         paymentId: payment.id,
         billplzPaid: result.billplzPaid,
         localStatus: result.localStatus,
         updated: result.updated
       });

       return NextResponse.json({
         payment: {
           ...payment,
           status: result.localStatus,
           bookingStatus: result.updated ? "confirmed" : undefined,
         },
         billplz: billplzData,
       });
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
       const parsed = createBillSchema.safeParse(body);
       if (!parsed.success) {
         return NextResponse.json(
           { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
           { status: 400 },
         );
       }

       const session = await getAuthSession();
       const { bookingId, description, name, email, phone, idempotencyKey } = parsed.data;

       // Auth check: verify ownership or admin
       const [authBooking] = await db
         .select({ userId: bookings.userId })
         .from(bookings)
         .where(eq(bookings.id, bookingId))
         .limit(1);

       if (authBooking) {
         const isGuestBooking = authBooking.userId?.startsWith("guest_") ?? false;
         if (!isGuestBooking) {
           if (!session) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
           }
           if (!hasAdminAccess(session) && authBooking.userId !== session.id) {
             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
           }
         }
       }

       // Track bill creation attempt
       await PaymentAnalytics.trackPaymentEvent("bill_creation_attempt", 0, {
         bookingId,
         hasIdempotencyKey: !!idempotencyKey,
         userId: session?.id ?? null
       });

       const result = await createBillForBooking({
         bookingId,
         description,
         name,
         email,
         phone,
         idempotencyKey,
       });

       if (!result.ok) {
         // Track bill creation failure
         await PaymentAnalytics.trackPaymentEvent("bill_creation_failed", 0, {
           bookingId,
           error: result.error,
           status: result.status
         });
         return NextResponse.json({ error: result.error }, { status: result.status });
       }

       // Track bill creation success
       await PaymentAnalytics.trackPaymentEvent("bill_creation_success", result.data.payment.id, {
         bookingId,
         billplzId: result.data.bill.id,
         amount: result.data.payment.amount,
         cached: result.data.cached
       });

       return NextResponse.json(result.data, { status: result.data.cached ? 200 : 201 });
     }

    if (action === "register-bank") {
      const parsed = registerBankSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const session = await getAuthSession();
      const { userId, bankName, bankCode, accountNumber, accountHolder } = parsed.data;
      if (!session || session.id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const [bank] = await db
        .update(profiles)
        .set({ bankName, bankCode: bankCode ?? null, accountNumber, accountHolder })
        .where(eq(profiles.userId, userId))
        .returning({
          id: profiles.userId,
          bankName: profiles.bankName,
          bankCode: profiles.bankCode,
          accountNumber: profiles.accountNumber,
          accountHolder: profiles.accountHolder,
        });

      return NextResponse.json({ success: true, bank });
    }

   if (action === "create-remaining-bill") {
     const session = await getAuthSession();
     const parsed = createRemainingBillSchema.safeParse(body);
     if (!parsed.success) {
       return NextResponse.json(
         { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
         { status: 400 },
       );
     }
     const { bookingId, idempotencyKey } = parsed.data;

     if (!bookingId) {
       return NextResponse.json(
         { error: "bookingId is required" },
         { status: 400 },
       );
     }

       const [booking] = await db
         .select()
         .from(bookings)
         .where(eq(bookings.id, Number(bookingId)))
         .limit(1);

       if (!booking) {
         return NextResponse.json({ error: "Booking not found" }, { status: 404 });
       }

       const isGuestBooking = booking.userId?.startsWith("guest_") ?? false;
       if (!isGuestBooking) {
         if (!session) {
           return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
         }
         if (!hasAdminAccess(session) && booking.userId !== session.id) {
           return NextResponse.json({ error: "Forbidden" }, { status: 403 });
         }
       }

       // Track remaining bill creation attempt
       await PaymentAnalytics.trackPaymentEvent("remaining_bill_creation_attempt", 0, {
         bookingId,
         hasIdempotencyKey: !!idempotencyKey,
         userId: session?.id ?? null
       });

       const remainingAmount =
         Number(booking.amount) - (Number(booking.depositAmount) || 0);
       if (!remainingAmount || remainingAmount < 1) {
         // Track remaining bill creation failure (no balance)
         await PaymentAnalytics.trackPaymentEvent("remaining_bill_creation_failed", 0, {
           bookingId,
           error: "No remaining balance to collect",
           remainingAmount
         });
         return NextResponse.json(
           { error: "No remaining balance to collect" },
           { status: 400 },
         );
       }

       if (idempotencyKey) {
         const [existing] = await db
           .select()
           .from(payments)
           .where(eq(payments.idempotencyKey, idempotencyKey))
           .limit(1);
         if (existing) {
           // Track remaining bill creation cached
           await PaymentAnalytics.trackPaymentEvent("remaining_bill_creation_cached", existing.id, {
             bookingId,
             paymentId: existing.id
           });
           return NextResponse.json(
             { bill: { id: existing.billplzId }, payment: existing, cached: true },
             { status: 200 },
           );
         }
       }

       const billplzBody = new URLSearchParams({
         collection_id: billplz.require("COLLECTION_ID"),
         description: `Remaining balance for booking #${bookingId} (${booking.service || "service"})`,
         amount: String(Math.round(remainingAmount * 100)),
         name: "Customer",
         email: "",
         phone: "",
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
         // Track remaining bill creation failure (Billplz error)
         await PaymentAnalytics.trackPaymentEvent("remaining_bill_creation_failed", 0, {
           bookingId,
             error: billplzData,
           status: billplzResponse.status
         });
         return NextResponse.json({ error: billplzData }, { status: billplzResponse.status });
       }

       const [payment] = await db
         .insert(payments)
         .values({
           bookingId: Number(bookingId),
           amount: Math.round(remainingAmount * 100),
           status: "pending",
           billplzId: billplzData.id,
           method: "billplz",
           idempotencyKey: idempotencyKey || null,
         })
         .returning();

       // Track remaining bill creation success
       await PaymentAnalytics.trackPaymentEvent("remaining_bill_creation_success", payment.id, {
         bookingId,
         billplzId: billplzData.id,
         amount: payment.amount,
         remainingAmount
       });

       return NextResponse.json({ bill: billplzData, payment }, { status: 201 });
     }

     if (action === "qr-payment") {
       const parsed = qrPaymentSchema.safeParse(body);
       if (!parsed.success) {
         return NextResponse.json(
           { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
           { status: 400 },
         );
       }

       const session = await getAuthSession();
       if (!session || !hasAdminAccess(session)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
       }
       const { bookingId } = parsed.data;
       const [booking] = await db
         .select()
         .from(bookings)
         .where(eq(bookings.id, Number(bookingId)))
         .limit(1);
       if (!booking) {
         return NextResponse.json({ error: "Booking not found" }, { status: 404 });
       }
       const remainingAmount =
         Number(booking.amount) - (Number(booking.depositAmount) || 0);
       if (remainingAmount <= 0) {
         // Track QR payment creation failure (no balance)
         await PaymentAnalytics.trackPaymentEvent("qr_payment_creation_failed", 0, {
           bookingId,
           error: "No remaining balance to collect",
           remainingAmount
         });
         return NextResponse.json(
           { error: "No remaining balance to collect" },
           { status: 400 },
         );
       }
       const existingQr = await db
         .select()
         .from(payments)
         .where(
           and(
             eq(payments.bookingId, Number(bookingId)),
             eq(payments.method, "qr"),
           ),
         )
         .limit(1);
       if (existingQr.length > 0) {
         // Track QR payment creation failure (duplicate)
         await PaymentAnalytics.trackPaymentEvent("qr_payment_creation_failed", 0, {
           bookingId,
           error: "QR payment already recorded for this booking"
         });
         return NextResponse.json(
           { error: "QR payment already recorded for this booking" },
           { status: 409 },
         );
       }

       // Track QR payment creation attempt
       await PaymentAnalytics.trackPaymentEvent("qr_payment_creation_attempt", 0, {
         bookingId,
         remainingAmount
       });

       const [payment] = await db
         .insert(payments)
         .values({
           bookingId: Number(bookingId),
           amount: Math.round(remainingAmount * 100),
           status: "paid",
           method: "qr",
           idempotencyKey: `qr_${bookingId}`,
           paidAt: new Date(),
           createdAt: new Date(),
           updatedAt: new Date(),
         })
         .returning();

       await db
         .update(bookings)
         .set({ status: "confirmed", updatedAt: new Date() })
         .where(eq(bookings.id, Number(bookingId)));

       // Track QR payment creation success
       await PaymentAnalytics.trackPaymentEvent("qr_payment_creation_success", payment.id, {
         bookingId,
         amount: payment.amount,
         remainingAmount
       });

 if (booking.userId) {
   const [customerUser] = await db
     .select({ name: users.name, phone: users.phone })
     .from(users)
     .where(eq(users.id, booking.userId))
     .limit(1);
   if (customerUser?.phone) {
     const customerName = customerUser.name || "Customer";
     await sendPaymentConfirmation({
       customerName,
       bookingId: String(bookingId),
       amount: remainingAmount,
       phone: customerUser.phone,
     }).catch((err: unknown) => console.error("QR payment WhatsApp failed:", err));
   }
 }

 return NextResponse.json({ success: true, payment });
     }

     if (action === "release") {
       const parsed = releasePaymentSchema.safeParse(body);
       if (!parsed.success) {
         return NextResponse.json(
           { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
           { status: 400 },
         );
       }

       const session = await getAuthSession();
       if (!session || !hasAdminAccess(session)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
       }
       const { paymentId } = parsed.data;

       const [payment] = await db
         .select()
         .from(payments)
         .where(eq(payments.id, Number(paymentId)))
         .limit(1);

       if (!payment || payment.status !== "held") {
         // Track payment release failure
         await PaymentAnalytics.trackPaymentEvent("payment_release_failed", 0, {
           paymentId: Number(paymentId),
           error: !payment ? "Payment not found" : `Invalid status: ${payment.status}`,
           currentStatus: payment?.status ?? null
         });
         return NextResponse.json(
           { error: "Payment not found or not in held status" },
           { status: 400 },
         );
       }

       // Track payment release attempt
       await PaymentAnalytics.trackPaymentEvent("payment_release_attempt", payment.id, {
         paymentAmount: payment.amount,
         bookingId: payment.bookingId
       });

       await db
         .update(payments)
         .set({ status: "released", updatedAt: new Date() })
         .where(eq(payments.id, Number(paymentId)));

       // Track payment release success
       await PaymentAnalytics.trackPaymentEvent("payment_release_success", payment.id, {
         paymentAmount: payment.amount,
         bookingId: payment.bookingId
       });

       return NextResponse.json({ success: true });
     }

     if (action === "refund") {
       const parsed = refundPaymentSchema.safeParse(body);
       if (!parsed.success) {
         return NextResponse.json(
           { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
           { status: 400 },
         );
       }

       const session = await getAuthSession();
       if (!session || !hasAdminAccess(session)) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
       }
       const { paymentId } = parsed.data;

       const [payment] = await db
         .select()
         .from(payments)
         .where(eq(payments.id, Number(paymentId)))
         .limit(1);

       if (!payment || !payment.status || !["paid", "held"].includes(payment.status)) {
         // Track refund initiation failure
         await PaymentAnalytics.trackPaymentEvent("refund_initiation_failed", 0, {
           paymentId: Number(paymentId),
           error: !payment ? "Payment not found" : `Invalid status: ${payment.status}`,
           paymentStatus: payment?.status ?? null
         });
         return NextResponse.json(
           { error: "Payment not found or cannot be refunded" },
           { status: 400 },
         );
       }

       // Track refund initiation attempt
       await PaymentAnalytics.trackPaymentEvent("refund_initiation_attempt", payment.id, {
         paymentAmount: payment.amount,
         paymentStatus: payment.status,
         hasBillplzId: !!payment.billplzId
       });

       if (payment.billplzId) {
         let billplzData: { ok: boolean; status: number; body: unknown };
         try {
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
           const parsed = await billplzResponse.json().catch(() => billplzResponse.text());
           billplzData = {
             ok: billplzResponse.ok,
             status: billplzResponse.status,
             body: parsed,
           };
         } catch (err) {
           console.error("[refund] Billplz refund call failed:", err);
           
           // Track Billplz refund API failure
           await PaymentAnalytics.trackPaymentEvent("refund_billplz_api_failed", payment.id, {
             paymentId: payment.id,
             error: err instanceof Error ? err.message : String(err)
           });
           
           await db
             .update(payments)
             .set({ status: "refund_pending", updatedAt: new Date() })
             .where(eq(payments.id, Number(paymentId)));
           return NextResponse.json(
             { error: "Refund initiated locally. Billplz refund request failed." },
             { status: 202 },
           );
         }

         if (!billplzData.ok) {
           // Billplz's public API does not expose a bill-level refund endpoint
           // (verified against the current API reference — V3 bills only support
           // Create/Get/Delete/Transactions). A 404/422 here therefore means the
           // refund must be carried out manually from the Billplz dashboard. Mark
           // the payment refund_pending so it is surfaced to admins for handling
           // instead of erroring and leaving the payment stuck in paid state.
           await db
             .update(payments)
             .set({ status: "refund_pending", updatedAt: new Date() })
             .where(eq(payments.id, Number(paymentId)));

           // Track Billplz refund failure
           await PaymentAnalytics.trackPaymentEvent("refund_billplz_failed", payment.id, {
             paymentId: payment.id,
             billplzResponse: billplzData
           });

           const body = billplzData.body;
           const msg =
             typeof body === "string"
               ? body
               : (body as Record<string, unknown>)?.error
                 ? typeof (body as Record<string, { message?: string }>).error === "string"
                   ? ((body as Record<string, { message?: string }>).error as string)
                   : ((body as Record<string, { message?: string }>).error as Record<string, string>)?.message
                 : (body as Record<string, string>)?.message ?? JSON.stringify(body);

           return NextResponse.json(
             {
               error:
                 msg ||
                 "Billplz refund request failed. Payment marked refund_pending — complete the refund manually from the Billplz dashboard.",
               status: "refund_pending",
             },
             { status: 202 },
           );
         }

         // Track Billplz refund success
         await PaymentAnalytics.trackPaymentEvent("refund_billplz_success", payment.id, {
           paymentId: payment.id,
           billplzResponse: billplzData
         });
       }

       await db
         .update(payments)
         .set({ status: "refunded", updatedAt: new Date() })
         .where(eq(payments.id, Number(paymentId)));
       // Track refund success
       await PaymentAnalytics.trackPaymentEvent("refund_success", payment.id, {
         paymentAmount: payment.amount,
         originalStatus: payment.status,
         usedBillplz: !!payment.billplzId
       });
       return NextResponse.json({ success: true });
     }

     return NextResponse.json({ error: "Unknown action" }, { status: 400 });
   } catch (error) {
     console.error("Payments POST error:", error);
     return NextResponse.json({ error: "Failed" }, { status: 500 });
   }
 }

  // Health check endpoint for payment system
  export async function GET_HEALTH(request: NextRequest) {
    try {
      // Simple health check - just verify we can connect to the database
      await db.select().from(payments).limit(1);
      
      return NextResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        message: "Payment system is operational"
      });
    } catch (error) {
      console.error("Payment health check failed:", error);
      return NextResponse.json(
        { 
          status: "unhealthy", 
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
  }
