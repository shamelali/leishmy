import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { acceptQuoteSchema } from "@/lib/validations/bookings";
import { sendBookingReceivedEmail, sendProviderNewBookingEmail } from "@/lib/email";
import { createBillForBooking } from "@/lib/billplz-bill";
import { logAudit } from "@/lib/audit";
import { sendPushNotification } from "@/lib/notifications/push";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = Number(id);

    const body = await request.json();
    const parsed = acceptQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify booking exists and is in an acceptable status
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Allow acceptance from both "quote_sent" (quote flow) and "requested" (direct accept)
    if (booking.status !== "quote_sent" && booking.status !== "requested") {
      return NextResponse.json(
        { error: "Booking is not awaiting acceptance" },
        { status: 400 },
      );
    }

    // Verify customer owns this booking
    if (booking.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate total: for requested status use service price from DB, for quote_sent use quote columns
    let totalPrice: number;
    let depositPercentNum: number;
    let depositAmount: number;

    if (booking.status === "requested") {
      // Direct accept at fixed service price
      totalPrice = Number(booking.amount) || 0;
      depositPercentNum = Math.min(100, Math.max(10, booking.depositPercent || 30));
      depositAmount = Math.round(totalPrice * (depositPercentNum / 100) * 100) / 100;
    } else {
      // Quote acceptance: use quote columns
      const quoteTotal =
        (Number(booking.servicePrice) || 0) +
        (Number(booking.accommodationFee) || 0) +
        (Number(booking.travelSurcharge) || 0);
      totalPrice = quoteTotal || Number(booking.amount) || 0;
      depositPercentNum = Math.min(100, Math.max(10, booking.depositPercent || 30));
      depositAmount = Math.round(totalPrice * (depositPercentNum / 100) * 100) / 100;
    }

    const previousStatus = booking.status;

    // Update booking: set amount to total, status to pending, milestone to deposit_{percent}
    const [updated] = await db
      .update(bookings)
      .set({
        status: "pending",
        amount: String(totalPrice),
        depositAmount: String(depositAmount),
        milestone: `deposit_${depositPercentNum}`,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    logAudit(db, {
      actorId: session.id,
      action: previousStatus === "requested" ? "booking.direct_accepted" : "booking.quote_accepted",
      entityType: "booking",
      entityId: String(bookingId),
      meta: { previousStatus, newStatus: "pending", totalPrice, depositAmount },
    }).catch(() => {});

    // Notify provider
    if (booking.artistId) {
      const [artist] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, booking.artistId), eq(profiles.role, "artist")))
        .limit(1);

      if (artist) {
        await db.insert(notifications).values({
          userId: artist.userId,
          type: "booking_accepted",
          title: "Booking Accepted",
          body: `Customer accepted the booking for "${booking.service}". Awaiting payment.`,
          data: { link: `/dashboard/artist/bookings`, bookingId: String(booking.id) },
        }).catch(() => {});

        // Send push notification
        sendPushNotification(artist.userId, {
          title: "Booking Accepted",
          body: `Customer accepted the booking for "${booking.service}". Awaiting payment.`,
          url: "/dashboard/artist/bookings",
        }).catch(() => {});

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
            travelSurcharge: Number(booking.travelSurcharge) || undefined,
            accommodationFee: Number(booking.accommodationFee) || undefined,
            totalPrice: Number(booking.amount) || undefined,
            depositAmount: Number(booking.depositAmount) || undefined,
            depositPercent: booking.depositPercent || undefined,
          }).catch((err) => console.error("sendProviderNewBookingEmail failed:", err));
        }
      }
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    // Create deposit bill via Billplz
    const [customerUser] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    const idempotencyKey = `accept_${bookingId}_${Date.now()}`;
    const billResult = await createBillForBooking({
      bookingId,
      description: `Booking deposit — ${booking.service || "service"}`,
      name: customerUser?.name || undefined,
      email: customerUser?.email || session.email || undefined,
      idempotencyKey,
    });

    if (!billResult.ok) {
      console.error("Bill creation failed after quote acceptance:", billResult.error);
      // Booking was already accepted — still return success for the acceptance
      // but surface the bill error so the client can retry payment separately
      return NextResponse.json({
        success: true,
        booking: updated,
        depositAmount,
        totalPrice,
        billError: billResult.error,
      });
    }

    return NextResponse.json({
      success: true,
      booking: updated,
      depositAmount,
      totalPrice,
      bill: billResult.data.bill,
      payment: billResult.data.payment,
      cached: billResult.data.cached,
    });
  } catch (error) {
    console.error("Accept quote error:", error);
    return NextResponse.json(
      { error: "Failed to accept quote" },
      { status: 500 }
    );
  }
}