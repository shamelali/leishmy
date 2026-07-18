import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, artists, studios, notifications, referrals } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { sendBookingConfirmationEmail, sendProviderNewBookingEmail } from "@/lib/email";
import { getAuthSession } from "@/lib/auth/server";
import { awardPoints } from "@/lib/loyalty";
import crypto from "crypto";

export const runtime = "nodejs";

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
        location: body.location || null,
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

    if (artist?.userId) {
      await db.insert(notifications).values({
        userId: artist.userId,
        type: "booking_confirmed",
        title: "New Booking Received",
        body: `${customer.name || "A customer"} booked "${serviceName}" on ${formattedDate}${time ? ` at ${time}` : ""}.`,
        data: { link: "/dashboard/bookings", bookingId: String(booking.id) },
      }).catch(() => {});
    }

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
    }).catch((err) => console.error("sendBookingConfirmationEmail failed:", err));

    if (artist?.email) {
      sendProviderNewBookingEmail({
        email: artist.email,
        providerName: artist.name,
        customerName: customer.name || "A customer",
        bookingId: String(booking.id),
        serviceName,
        date: formattedDate,
        time: time || "To be confirmed",
      }).catch((err) => console.error("sendProviderNewBookingEmail failed:", err));
    }

    const refCookie = request.cookies.get("leish_ref");
    if (refCookie?.value && artist) {
      try {
        const ref = JSON.parse(refCookie.value);
        if (ref?.t === "artist" && ref?.id) {
          const referrerIdNum = Number(ref.id);
          if (referrerIdNum !== artist.id) {
            const referrerOwnerId = await db
              .select({ uid: artists.userId })
              .from(artists)
              .where(eq(artists.id, referrerIdNum))
              .limit(1)
              .then(r => r[0]?.uid);

            if (referrerOwnerId && referrerOwnerId !== customer.id) {
              const [existingReferral] = await db
                .select({ id: referrals.id, status: referrals.status })
                .from(referrals)
                .where(and(
                  eq(referrals.referrerType, "artist"),
                  eq(referrals.referrerId, referrerIdNum),
                  eq(referrals.referredUserId, customer.id),
                ))
                .limit(1);

              if (existingReferral && (existingReferral.status === "clicked" || existingReferral.status === "registered")) {
                await db.update(referrals).set({
                  bookingId: booking.id,
                  status: "booked",
                  bookedAt: new Date(),
                }).where(eq(referrals.id, existingReferral.id));
              } else if (!existingReferral) {
                await db.insert(referrals).values({
                  referrerType: "artist",
                  referrerId: referrerIdNum,
                  referredUserId: customer.id,
                  referredEmail: customer.email,
                  bookingId: booking.id,
                  status: "booked",
                  bookedAt: new Date(),
                });
              }

              if (existingReferral?.status !== "rewarded") {
                const pointsAwarded = await awardPoints(
                  referrerOwnerId,
                  "referral",
                  String(booking.id),
                  `Referral booking #${booking.id}`,
                );
                if (pointsAwarded) {
                  await db.update(referrals).set({
                    status: "rewarded",
                    pointsAwarded,
                    rewardedAt: new Date(),
                  }).where(
                    and(
                      eq(referrals.referrerType, "artist"),
                      eq(referrals.referrerId, referrerIdNum),
                      eq(referrals.referredUserId, customer.id),
                    ),
                  );

                  await db.insert(notifications).values({
                    userId: referrerOwnerId,
                    type: "loyalty",
                    title: "🎉 Referral Reward!",
                    body: `You earned ${pointsAwarded} loyalty points from a referral booking!`,
                    data: { link: "/dashboard/artist/share", pointsAwarded: String(pointsAwarded) },
                  }).catch(() => {});
                }
              }
            }
          }
        }
      } catch {
        // invalid referral cookie - ignore silently
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
    const session = await getAuthSession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const offset = (page - 1) * pageSize;

    if (id) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(id)))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      if (session && session.role !== "admin" && booking.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userId) {
      if (session.role !== "admin" && session.id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const [totalResult] = await db
        .select({ count: count() })
        .from(bookings)
        .where(eq(bookings.userId, userId));
      const total = totalResult?.count ?? 0;
      const userBookings = await db
        .select({
          id: bookings.id,
          userId: bookings.userId,
          artistId: bookings.artistId,
          studioId: bookings.studioId,
          serviceId: bookings.serviceId,
          service: bookings.service,
          notes: bookings.notes,
          location: bookings.location,
          date: bookings.date,
          time: bookings.time,
          amount: bookings.amount,
          status: bookings.status,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          artistName: artists.name,
        })
        .from(bookings)
        .leftJoin(artists, eq(bookings.artistId, artists.id))
        .where(eq(bookings.userId, userId))
        .limit(pageSize)
        .offset(offset);
      return NextResponse.json({
        bookings: userBookings.map(b => ({
          ...b,
          id: String(b.id),
          artistId: b.artistId ? String(b.artistId) : null,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalResult] = await db.select({ count: count() }).from(bookings);
    const total = totalResult?.count ?? 0;
    const rawBookings = await db
      .select()
      .from(bookings)
      .limit(pageSize)
      .offset(offset);

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

    return NextResponse.json({
      bookings: allBookings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
