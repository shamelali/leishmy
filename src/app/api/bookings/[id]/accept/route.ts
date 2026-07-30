import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { acceptQuoteSchema } from "@/lib/validations/bookings";
import { sendBookingReceivedEmail, sendProviderNewBookingEmail } from "@/lib/email";

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

    // Calculate deposit (30% of total)
    const totalPrice = Number(booking.amount);
    const depositAmount = Math.round(totalPrice * 0.3 * 100) / 100;

    // Update booking status to pending (awaiting payment)
    const [updated] = await db
      .update(bookings)
      .set({
        status: "pending",
        depositAmount: String(depositAmount),
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Create payment bill
    const billRes = await fetch("/api/payments?action=create-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        name: "", // Will be filled by API
        email: "", // Will be filled by API
        description: `${booking.service} with provider`,
        idempotencyKey: `booking_${bookingId}`,
        amount: totalPrice * 100, // convert to cents
      }),
    });

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
          title: "Quote Accepted",
          body: `Customer accepted your quote for "${booking.service}". Payment pending.`,
          data: { link: `/dashboard/bookings`, bookingId: String(booking.id) },
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
            serviceName: booking.service,
            date: new Date(booking.date).toLocaleDateString("en-MY", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            }),
            time: booking.time || "To be confirmed",
            travelSurcharge: Number(booking.travelFee) || undefined,
            accommodationFee: Number(booking.accommodationFee) || undefined,
          }).catch((err) => console.error("sendProviderNewBookingEmail failed:", err));
        }
      }
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");

    return NextResponse.json({ 
      success: true, 
      booking: updated,
      paymentUrl: billRes.ok ? (await billRes.json())?.bill?.url : null 
    });
  } catch (error) {
    console.error("Accept quote error:", error);
    return NextResponse.json(
      { error: "Failed to accept quote" },
      { status: 500 }
    );
  }
}