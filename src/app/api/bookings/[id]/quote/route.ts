import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { addQuoteSchema } from "@/lib/validations/bookings";
import { sendQuoteReadyEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function PUT(
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
    const parsed = addQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { servicePrice, accommodationFee, travelFee, notes } = parsed.data;

    // Verify booking exists and is in quote_pending status
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "quote_pending") {
      return NextResponse.json(
        { error: "Booking is not awaiting a quote" },
        { status: 400 },
      );
    }

    // Verify MUA owns this booking
    if (booking.artistId) {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, booking.artistId), eq(profiles.role, "artist")))
        .limit(1);
      if (!profile || profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (booking.studioId) {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, booking.studioId), eq(profiles.role, "studio")))
        .limit(1);
      if (!profile || profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const totalPrice = servicePrice + (accommodationFee || 0) + (travelFee || 0);
    const depositAmount = Math.round(totalPrice * 0.3 * 100) / 100; // 30% deposit

    // Update booking with quote
    const [updated] = await db
      .update(bookings)
      .set({
        amount: String(totalPrice),
        depositAmount: String(depositAmount),
        servicePrice: String(servicePrice),
        accommodationFee: String(accommodationFee || 0),
        travelSurcharge: String(travelFee || 0),
        notes: notes || null,
        status: "quote_sent",
        milestone: "deposit_30",
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Notify customer
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    if (user?.id) {
      await db.insert(notifications).values({
        userId: user.id,
        type: "quote_ready",
        title: "Your Quote is Ready",
        body: `Your quote for "${booking.service}" is ready. Review and accept to proceed with booking.`,
        data: { link: `/bookings/${booking.id}`, bookingId: String(booking.id) },
      }).catch(() => {});
    }

    // Email customer
    if (user?.email) {
      sendQuoteReadyEmail({
        email: user.email,
        customerName: user.name || "Valued Customer",
        bookingId: String(booking.id),
        serviceName: booking.service || "Service",
        providerName: "", // Will be filled by email template
        date: new Date(booking.date).toLocaleDateString("en-MY", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        time: booking.time || "To be confirmed",
        servicePrice,
        accommodationFee: accommodationFee || 0,
        travelFee: travelFee || 0,
        totalPrice,
        depositAmount,
      }).catch((err) => console.error("sendQuoteReadyEmail failed:", err));
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Add quote error:", error);
    return NextResponse.json(
      { error: "Failed to add quote" },
      { status: 500 }
    );
  }
}