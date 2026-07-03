import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, artists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendBookingConfirmationEmail, sendProviderNewBookingEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, artistId, studioId, serviceId, date, time, amount, status } = body;

    if (!userId || !date || !amount) {
      return NextResponse.json(
        { error: "userId, date, and amount are required" },
        { status: 400 }
      );
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        userId,
        artistId: artistId || null,
        studioId: studioId || null,
        serviceId: serviceId || null,
        date: new Date(date),
        time: time || null,
        amount,
        status: status || "pending",
      })
      .returning();

    const [customer, artist] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]),
      artistId
        ? db.select().from(artists).where(eq(artists.id, artistId)).limit(1).then((r) => r[0])
        : Promise.resolve(undefined),
    ]);

    if (customer) {
      const formattedDate = typeof date === "string"
        ? new Date(date).toLocaleDateString("en-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : new Date(date).toLocaleDateString("en-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      sendBookingConfirmationEmail({
        email: customer.email,
        customerName: customer.name || "Valued Customer",
        bookingId: String(booking.id),
        serviceName: serviceId ? `Service #${serviceId}` : "Beauty Service",
        providerName: artist?.name || "Your Provider",
        date: formattedDate,
        time: time || "To be confirmed",
        amount: Number(amount),
        paymentType: "full",
      }).catch(() => {});

      if (artist) {
        sendProviderNewBookingEmail({
          email: artist.email || "",
          providerName: artist.name,
          customerName: customer.name || "A customer",
          bookingId: String(booking.id),
          serviceName: serviceId ? `Service #${serviceId}` : "Beauty Service",
          date: formattedDate,
          time: time || "To be confirmed",
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(id)))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      let artistName = "";
      if (booking.artistId) {
        const [artist] = await db
          .select()
          .from(artists)
          .where(eq(artists.id, booking.artistId))
          .limit(1);
        artistName = artist?.name || "";
      }

      return NextResponse.json({
        booking: {
          ...booking,
          id: String(booking.id),
          clientName: user?.name || "Anonymous",
          clientEmail: user?.email || "",
          artistName,
        },
      });
    }

    const allBookings = await db.select().from(bookings);
    return NextResponse.json({ bookings: allBookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
