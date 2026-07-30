import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, profiles, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { rejectQuoteSchema } from "@/lib/validations/bookings";

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
    const parsed = rejectQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify booking exists and is in quote_sent status
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "quote_sent") {
      return NextResponse.json(
        { error: "Booking is not awaiting acceptance" },
        { status: 400 },
      );
    }

    // Verify customer owns this booking
    if (booking.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update booking status to rejected
    const [updated] = await db
      .update(bookings)
      .set({
        status: "rejected",
      })
      .where(eq(bookings.id, bookingId))
      .returning();

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
          type: "quote_rejected",
          title: "Quote Rejected",
          body: `Customer declined your quote for "${booking.service}".`,
          data: { link: `/dashboard/bookings`, bookingId: String(booking.id) },
        }).catch(() => {});
      }
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Reject quote error:", error);
    return NextResponse.json(
      { error: "Failed to reject quote" },
      { status: 500 }
    );
  }
}