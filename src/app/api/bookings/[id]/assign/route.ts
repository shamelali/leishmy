import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, profiles, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
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
    const { artistId } = body;

    if (!artistId) {
      return NextResponse.json({ error: "artistId required" }, { status: 400 });
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify the caller is the studio that owns this booking
    if (booking.studioId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the artist is linked to this studio
    const [staffMember] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(
        eq(profiles.userId, artistId),
        eq(profiles.studioId, session.id),
        eq(profiles.role, "artist"),
      ))
      .limit(1);

    if (!staffMember) {
      return NextResponse.json({ error: "Artist is not part of your studio" }, { status: 400 });
    }

    // Assign artist and move to confirmed
    const [updated] = await db
      .update(bookings)
      .set({
        artistId,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Notify the assigned artist
    await db.insert(notifications).values({
      userId: artistId,
      type: "booking_assigned",
      title: "Booking Assigned to You",
      body: `A booking for "${booking.service}" has been assigned to you by your studio.`,
      data: { link: `/bookings/${bookingId}`, bookingId: String(bookingId) },
    }).catch(() => {});

    sendPushNotification(artistId, {
      title: "Booking Assigned",
      body: `You've been assigned a "${booking.service}" booking.`,
      url: `/bookings/${bookingId}`,
    }).catch(() => {});

    // Notify customer
    if (booking.userId) {
      await db.insert(notifications).values({
        userId: booking.userId,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        body: `Your "${booking.service}" booking has been confirmed and assigned to an artist.`,
        data: { link: `/bookings/${bookingId}`, bookingId: String(bookingId) },
      }).catch(() => {});

      sendPushNotification(booking.userId, {
        title: "Booking Confirmed",
        body: `Your "${booking.service}" booking has been confirmed.`,
        url: `/bookings/${bookingId}`,
      }).catch(() => {});
    }

    revalidatePath("/dashboard/studio/bookings");
    revalidatePath("/bookings");

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Assign artist error:", error);
    return NextResponse.json(
      { error: "Failed to assign artist" },
      { status: 500 }
    );
  }
}
