import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, profiles, notifications } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/notifications/push";
import { rateLimitApi } from "@/lib/rate-limit-api";
import {
  AppError,
  correlationIdFrom,
  logCaught,
  withSerializableTransaction,
  withTimeout,
} from "@/lib/db-utils";
import { findConflictingBooking } from "@/lib/booking-slot";

export const runtime = "nodejs";

const NOTIFY_TIMEOUT_MS = 5_000;
const ASSIGNABLE_STATUSES = [
  "requested",
  "quote_pending",
  "quote_sent",
  "pending",
  "confirmed",
] as const;

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

    const body = await request.json() as { artistId?: unknown };
    const artistId = typeof body.artistId === "string" ? body.artistId.trim() : "";

    if (!artistId) {
      return jsonWithCorrelation(correlationId, { error: "artistId required" }, 400);
    }

    const updated = await withSerializableTransaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update")
        .limit(1);

      if (!booking) {
        throw new AppError(404, "Booking not found");
      }

      const isStudioOwner = booking.studioId === session.id;
      const isCurrentProvider = booking.artistId === session.id;
      const isAdmin = hasAdminAccess(session);
      if (!isStudioOwner && !isCurrentProvider && !isAdmin) {
        throw new AppError(403, "Forbidden");
      }

      if (!ASSIGNABLE_STATUSES.includes(booking.status as (typeof ASSIGNABLE_STATUSES)[number])) {
        throw new AppError(400, "Booking cannot be reassigned in its current status");
      }

      const staffWhere = isAdmin && !booking.studioId
        ? and(eq(profiles.userId, artistId), eq(profiles.role, "artist"))
        : and(
            eq(profiles.userId, artistId),
            eq(profiles.role, "artist"),
            booking.studioId
              ? eq(profiles.studioId, booking.studioId)
              : eq(profiles.studioId, session.id),
          );

      const [staffMember] = await tx
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(staffWhere)
        .limit(1);

      if (!staffMember) {
        throw new AppError(400, "Artist is not part of your studio");
      }

      if (booking.date && booking.time) {
        const conflict = await findConflictingBooking(tx, {
          artistId,
          studioId: booking.studioId,
          date: booking.date,
          time: booking.time,
        });
        if (conflict && conflict.id !== bookingId) {
          throw new AppError(409, "This time slot is no longer available for that artist");
        }
      }

      const [row] = await tx
        .update(bookings)
        .set({
          artistId,
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookings.id, bookingId),
            inArray(bookings.status, [...ASSIGNABLE_STATUSES]),
          ),
        )
        .returning();

      if (!row) {
        throw new AppError(409, "Booking cannot be reassigned in its current status");
      }

      return { booking, updated: row };
    }, { correlationId });

    await withTimeout(
      db.insert(notifications).values({
        userId: artistId,
        type: "booking_assigned",
        title: "Booking Assigned to You",
        body: `A booking for "${updated.booking.service}" has been assigned to you by your studio.`,
        data: { link: `/bookings/${bookingId}`, bookingId: String(bookingId) },
      }),
      NOTIFY_TIMEOUT_MS,
      "booking_assigned",
      correlationId,
    );

    void withTimeout(
      sendPushNotification(artistId, {
        title: "Booking Assigned",
        body: `You've been assigned a "${updated.booking.service}" booking.`,
        url: `/bookings/${bookingId}`,
      }),
      NOTIFY_TIMEOUT_MS,
      "push_booking_assigned",
      correlationId,
    );

    if (updated.booking.userId) {
      await withTimeout(
        db.insert(notifications).values({
          userId: updated.booking.userId,
          type: "booking_confirmed",
          title: "Booking Confirmed",
          body: `Your "${updated.booking.service}" booking has been confirmed and assigned to an artist.`,
          data: { link: `/bookings/${bookingId}`, bookingId: String(bookingId) },
        }),
        NOTIFY_TIMEOUT_MS,
        "booking_confirmed",
        correlationId,
      );

      void withTimeout(
        sendPushNotification(updated.booking.userId, {
          title: "Booking Confirmed",
          body: `Your "${updated.booking.service}" booking has been confirmed.`,
          url: `/bookings/${bookingId}`,
        }),
        NOTIFY_TIMEOUT_MS,
        "push_booking_confirmed",
        correlationId,
      );
    }

    revalidatePath("/dashboard/studio/bookings");
    revalidatePath("/bookings");

    return jsonWithCorrelation(correlationId, { success: true, booking: updated.updated });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonWithCorrelation(correlationId, { error: error.message }, error.status);
    }
    logCaught("bookings.assign", error, { correlationId });
    return jsonWithCorrelation(correlationId, { error: "Failed to assign artist" }, 500);
  }
}
