import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { acceptQuoteSchema } from "@/lib/validations/bookings";
import { sendProviderNewBookingEmail, sendPaymentInstructionEmail } from "@/lib/email";
import { createBillForBooking } from "@/lib/billplz-bill";
import { logAudit } from "@/lib/audit";
import { sendPushNotification } from "@/lib/notifications/push";
import { rateLimitApi } from "@/lib/rate-limit-api";
import {
  AppError,
  correlationIdFrom,
  logCaught,
  withSerializableTransaction,
  withTimeout,
} from "@/lib/db-utils";
import {
  clampDepositPercent,
  depositCentsFromTotal,
  fromCents,
  myrString,
  toCents,
} from "@/lib/money";

export const runtime = "nodejs";

const NOTIFY_TIMEOUT_MS = 5_000;
const ACCEPTABLE_STATUSES = ["quote_sent", "requested"] as const;

function jsonWithCorrelation(correlationId: string, body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set("x-correlation-id", correlationId);
  return res;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = correlationIdFrom(request);
  const limited = await rateLimitApi(request, { max: 10, window: 60 });
  if (limited) {
    limited.headers.set("x-correlation-id", correlationId);
    return limited;
  }

  try {
    const session = await getAuthSession();
    if (!session) {
      return jsonWithCorrelation(correlationId, { error: "Unauthorized" }, 401);
    }

    const { id } = await params;
    const bookingId = Number(id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return jsonWithCorrelation(correlationId, { error: "Invalid booking id" }, 400);
    }

    const body = await request.json();
    const parsed = acceptQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonWithCorrelation(
        correlationId,
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    const accepted = await withSerializableTransaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update")
        .limit(1);

      if (!booking) {
        throw new AppError(404, "Booking not found");
      }

      if (booking.status !== "quote_sent" && booking.status !== "requested") {
        throw new AppError(400, "Booking is not awaiting acceptance");
      }

      if (booking.userId !== session.id) {
        throw new AppError(403, "Forbidden");
      }

      let totalCents: number;
      if (booking.status === "requested") {
        totalCents = toCents(booking.amount);
      } else {
        const quoteCents =
          toCents(booking.servicePrice) +
          toCents(booking.accommodationFee) +
          toCents(booking.travelSurcharge);
        totalCents = quoteCents > 0 ? quoteCents : toCents(booking.amount);
      }

      const depositPercentNum = clampDepositPercent(booking.depositPercent);
      const depositAmountCents = depositCentsFromTotal(totalCents, depositPercentNum);
      const previousStatus = booking.status;

      const [updated] = await tx
        .update(bookings)
        .set({
          status: "pending",
          amount: myrString(totalCents),
          depositAmount: myrString(depositAmountCents),
          milestone: `deposit_${depositPercentNum}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookings.id, bookingId),
            inArray(bookings.status, [...ACCEPTABLE_STATUSES]),
          ),
        )
        .returning();

      if (!updated) {
        throw new AppError(409, "Booking was already processed");
      }

      return {
        booking,
        updated,
        previousStatus,
        depositPercentNum,
        depositAmount: fromCents(depositAmountCents),
        totalPrice: fromCents(totalCents),
      };
    }, { correlationId });

    const { booking, updated, previousStatus, depositPercentNum, depositAmount, totalPrice } =
      accepted;

    void logAudit(db, {
      actorId: session.id,
      action: previousStatus === "requested" ? "booking.direct_accepted" : "booking.quote_accepted",
      entityType: "booking",
      entityId: String(bookingId),
      meta: { previousStatus, newStatus: "pending", totalPrice, depositAmount, correlationId },
    });

    if (booking.artistId) {
      const [artist] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, booking.artistId), eq(profiles.role, "artist")))
        .limit(1);

      if (artist) {
        await withTimeout(
          db.insert(notifications).values({
            userId: artist.userId,
            type: "booking_accepted",
            title: "Booking Accepted",
            body: `Customer accepted the booking for "${booking.service}". Awaiting payment.`,
            data: { link: `/bookings/${bookingId}`, bookingId: String(booking.id) },
          }),
          NOTIFY_TIMEOUT_MS,
          "booking_accepted",
          correlationId,
        );

        void withTimeout(
          sendPushNotification(artist.userId, {
            title: "Booking Accepted",
            body: `Customer accepted the booking for "${booking.service}". Awaiting payment.`,
            url: `/bookings/${bookingId}`,
          }),
          NOTIFY_TIMEOUT_MS,
          "push_booking_accepted",
          correlationId,
        );

        const [providerUser] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, artist.userId))
          .limit(1);

        if (providerUser?.email) {
          const [customer] = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, booking.userId))
            .limit(1);

          void withTimeout(
            sendProviderNewBookingEmail({
              email: providerUser.email,
              providerName: providerUser.name || "Your Provider",
              customerName: customer?.name || "A customer",
              bookingId: String(booking.id),
              serviceName: booking.service || "Service",
              date: new Date(booking.date).toLocaleDateString("en-MY", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              }),
              time: booking.time || "To be confirmed",
              travelSurcharge: fromCents(toCents(booking.travelSurcharge)) || undefined,
              accommodationFee: fromCents(toCents(booking.accommodationFee)) || undefined,
              totalPrice,
              depositAmount,
              depositPercent: depositPercentNum,
            }),
            NOTIFY_TIMEOUT_MS,
            "email_provider_accepted",
            correlationId,
          );
        }
      }
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    const [customerUser] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    // Time-windowed idempotency key so retries within the same minute reuse the bill.
    const idempotencyKey = `accept_${bookingId}_${Math.floor(Date.now() / 60_000)}`;
    const billResult = await createBillForBooking({
      bookingId,
      description: `Booking deposit — ${booking.service || "service"}`,
      name: customerUser?.name || undefined,
      email: customerUser?.email || session.email || undefined,
      idempotencyKey,
    });

    if (!billResult.ok) {
      logCaught("bookings.accept.bill", billResult.error, { correlationId, bookingId });
      return jsonWithCorrelation(correlationId, {
        success: true,
        booking: updated,
        depositAmount,
        totalPrice,
        billError: billResult.error,
      });
    }

    const bill = billResult.data.bill as { id: string; url?: string };
    let paymentUrl: string | undefined = bill.url;
    if (!paymentUrl && bill.id) {
      const billplzApiUrl =
        process.env.BILLPLZ_API_URL || "https://www.billplz-api.my/v4";
      const billplzBaseUrl = billplzApiUrl.replace("/api/v3", "");
      paymentUrl = `${billplzBaseUrl}/v4/bills/${bill.id}`;
    }

    if (customerUser?.email && paymentUrl) {
      let providerName = "Your Provider";
      if (booking.artistId) {
        const [artistUser] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, booking.artistId))
          .limit(1);
        providerName = artistUser?.name || providerName;
      } else if (booking.studioId) {
        const [studioUser] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, booking.studioId))
          .limit(1);
        providerName = studioUser?.name || providerName;
      }

      void withTimeout(
        sendPaymentInstructionEmail({
          email: customerUser.email,
          customerName: customerUser.name || "Valued Customer",
          bookingId: String(booking.id),
          serviceName: booking.service || "Service",
          providerName,
          date: new Date(booking.date).toLocaleDateString("en-MY", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          time: booking.time || "To be confirmed",
          depositAmount,
          totalPrice,
          depositPercent: depositPercentNum,
          paymentUrl,
        }),
        NOTIFY_TIMEOUT_MS,
        "email_payment_instruction",
        correlationId,
      );
    }

    return jsonWithCorrelation(correlationId, {
      success: true,
      booking: updated,
      depositAmount,
      totalPrice,
      bill: billResult.data.bill,
      payment: billResult.data.payment,
      cached: billResult.data.cached,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonWithCorrelation(correlationId, { error: error.message }, error.status);
    }
    logCaught("bookings.accept", error, { correlationId });
    return jsonWithCorrelation(correlationId, { error: "Failed to accept quote" }, 500);
  }
}
