import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, profiles, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { rejectQuoteSchema } from "@/lib/validations/bookings";
import { sendQuoteRejectedEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { rateLimitApi } from "@/lib/rate-limit-api";
import {
  AppError,
  correlationIdFrom,
  logCaught,
  withSerializableTransaction,
  withTimeout,
} from "@/lib/db-utils";

export const runtime = "nodejs";

const NOTIFY_TIMEOUT_MS = 5_000;

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
  const limited = await rateLimitApi(request, { max: 20, window: 60 });
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
    const parsed = rejectQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonWithCorrelation(
        correlationId,
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    const result = await withSerializableTransaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update")
        .limit(1);

      if (!booking) {
        throw new AppError(404, "Booking not found");
      }

      if (booking.status !== "quote_sent") {
        throw new AppError(400, "Booking is not awaiting acceptance");
      }

      if (booking.userId !== session.id) {
        throw new AppError(403, "Forbidden");
      }

      const [updated] = await tx
        .update(bookings)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(and(eq(bookings.id, bookingId), eq(bookings.status, "quote_sent")))
        .returning();

      if (!updated) {
        throw new AppError(409, "Booking is not awaiting acceptance");
      }

      return { booking, updated };
    }, { correlationId });

    const { booking, updated } = result;

    void logAudit(db, {
      actorId: session.id,
      action: "booking.quote_rejected",
      entityType: "booking",
      entityId: String(bookingId),
      meta: { previousStatus: "quote_sent", newStatus: "rejected", correlationId },
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
            type: "quote_rejected",
            title: "Quote Rejected",
            body: `Customer declined your quote for "${booking.service}".`,
            data: { link: `/bookings/${booking.id}`, bookingId: String(booking.id) },
          }),
          NOTIFY_TIMEOUT_MS,
          "quote_rejected_provider",
          correlationId,
        );
      }
    }

    if (booking.userId) {
      const [customer] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      if (customer?.id) {
        await withTimeout(
          db.insert(notifications).values({
            userId: customer.id,
            type: "quote_rejected",
            title: "Quote Rejected",
            body: `You have rejected the quote for "${booking.service}". You can request a new quote if you'd like to proceed.`,
            data: { link: "/bookings", bookingId: String(booking.id) },
          }),
          NOTIFY_TIMEOUT_MS,
          "quote_rejected_customer",
          correlationId,
        );
      }

      if (customer?.email) {
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
          sendQuoteRejectedEmail({
            email: customer.email,
            customerName: customer.name || "Valued Customer",
            bookingId: String(booking.id),
            serviceName: booking.service || "Service",
            providerName,
            date: new Date(booking.date).toLocaleDateString("en-MY", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            }),
            time: booking.time || "To be confirmed",
          }),
          NOTIFY_TIMEOUT_MS,
          "email_quote_rejected",
          correlationId,
        );
      }
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    return jsonWithCorrelation(correlationId, { success: true, booking: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonWithCorrelation(correlationId, { error: error.message }, error.status);
    }
    logCaught("bookings.reject", error, { correlationId });
    return jsonWithCorrelation(correlationId, { error: "Failed to reject quote" }, 500);
  }
}
