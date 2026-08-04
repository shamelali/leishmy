import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, profiles, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { rejectQuoteSchema } from "@/lib/validations/bookings";
import { sendQuoteRejectedEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

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

    logAudit(db, {
      actorId: session.id,
      action: "booking.quote_rejected",
      entityType: "booking",
      entityId: String(bookingId),
      meta: { previousStatus: "quote_sent", newStatus: "rejected" },
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
          type: "quote_rejected",
          title: "Quote Rejected",
          body: `Customer declined your quote for "${booking.service}".`,
          data: { link: `/dashboard/bookings`, bookingId: String(booking.id) },
        }).catch(() => {});
      }
    }

    // Notify customer
    if (booking.userId) {
      const [customer] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      if (customer?.id) {
        await db.insert(notifications).values({
          userId: customer.id,
          type: "quote_rejected",
          title: "Quote Rejected",
          body: `You have rejected the quote for "${booking.service}". You can request a new quote if you'd like to proceed.`,
          data: { link: "/bookings", bookingId: String(booking.id) },
        }).catch(() => {});
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
        }).catch((err) => console.error("sendQuoteRejectedEmail failed:", err));
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