import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, artists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendBookingConfirmationEmail, sendProviderNewBookingEmail } from "@/lib/email";
import crypto from "crypto";

function resolveCustomerId(body: any): string | null {
  if (body.userId) return body.userId;
  if (body.clientEmail) return "guest_" + crypto.randomUUID();
  return null;
}

async function ensureCustomer(body: any): Promise<{ id: string; name: string | null; email: string } | null> {
  const email = body.clientEmail || body.email;
  if (!email) return null;

  const existing = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)
    .then((r) => r[0]);

  if (existing) return existing;

  const newId = body.userId || "guest_" + crypto.randomUUID();
  await db.insert(users).values({
    id: newId,
    name: body.clientName || body.name || "Guest",
    email: email.toLowerCase(),
    role: "customer",
    location: body.location || "",
  }).onConflictDoNothing({ target: users.email });

  return { id: newId, name: body.clientName || body.name || "Guest", email: email.toLowerCase() };
}

async function resolveAmount(body: any, artistId: number | null): Promise<string> {
  if (body.amount) return String(body.amount);
  if (artistId) {
    const [artist] = await db
      .select({ price: artists.price })
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);
    if (artist?.price) return String(artist.price);
  }
  return "0";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, studioId, serviceId, date, time, status } = body;
    const artistIdNum = artistId ? Number(artistId) : null;

    const customer = await ensureCustomer(body);
    if (!customer || !date) {
      return NextResponse.json(
        { error: "clientEmail and date are required" },
        { status: 400 }
      );
    }

    const amount = await resolveAmount(body, artistIdNum);

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: customer.id,
        artistId: artistIdNum,
        studioId: studioId || null,
        serviceId: serviceId || null,
        service: body.service || null,
        notes: body.notes || null,
        date: new Date(date),
        time: time || null,
        amount,
        status: status || "pending",
      })
      .returning();

    const artist = artistIdNum
      ? await db.select().from(artists).where(eq(artists.id, artistIdNum)).limit(1).then((r) => r[0])
      : undefined;

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const serviceName = body.service || (serviceId ? `Service #${serviceId}` : "Beauty Service");

    sendBookingConfirmationEmail({
      email: customer.email,
      customerName: customer.name || "Valued Customer",
      bookingId: String(booking.id),
      serviceName,
      providerName: artist?.name || "Your Provider",
      date: formattedDate,
      time: time || "To be confirmed",
      amount: Number(amount),
      paymentType: "full",
    }).catch(() => {});

    if (artist?.email) {
      sendProviderNewBookingEmail({
        email: artist.email,
        providerName: artist.name,
        customerName: customer.name || "A customer",
        bookingId: String(booking.id),
        serviceName,
        date: formattedDate,
        time: time || "To be confirmed",
      }).catch(() => {});
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

    const rawBookings = await db.select().from(bookings);
    const allBookings = await Promise.all(
      rawBookings.map(async (b) => {
        let clientName = "Anonymous";
        let clientEmail = "";
        if (b.userId) {
          const [user] = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, b.userId))
            .limit(1);
          if (user) {
            clientName = user.name || "Anonymous";
            clientEmail = user.email || "";
          }
        }
        let artistName = "";
        if (b.artistId) {
          const [artist] = await db
            .select({ name: artists.name })
            .from(artists)
            .where(eq(artists.id, b.artistId))
            .limit(1);
          artistName = artist?.name || "";
        }
        return {
          ...b,
          id: String(b.id),
          clientName,
          clientEmail,
          artistName,
        };
      }),
    );
    return NextResponse.json({ bookings: allBookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
