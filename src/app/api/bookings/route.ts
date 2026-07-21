import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications, referrals } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendBookingConfirmationEmail, sendProviderNewBookingEmail } from "@/lib/email";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { awardPoints } from "@/lib/loyalty";
import crypto from "crypto";

export const runtime = "nodejs";

function resolveCustomerId(body: any): string | null {
  if (body.userId) return body.userId;
  if (body.clientEmail) return "guest_" + crypto.randomUUID();
  return null;
}

async function ensureCustomer(
  body: any,
  session: { id: string; name?: string | null; email: string } | null,
): Promise<{ id: string; name: string | null; email: string } | null> {
  const email = (body.clientEmail || body.email || session?.email || "").toLowerCase();
  if (!email) return null;

  // Prefer authenticated session user
  if (session?.id) {
    const existing = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1)
      .then((r) => r[0]);

    if (existing) return existing;

    await db.insert(users).values({
      id: session.id,
      name: session.name || body.clientName || body.name || "Customer",
      email,
      role: "customer",
      location: body.location || "",
    }).onConflictDoNothing({ target: users.email });

    return { id: session.id, name: session.name || body.clientName || body.name || "Customer", email };
  }

  const existing = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (existing) return existing;

  const newId = body.userId || "guest_" + crypto.randomUUID();
  await db.insert(users).values({
    id: newId,
    name: body.clientName || body.name || "Guest",
    email,
    role: "customer",
    location: body.location || "",
  }).onConflictDoNothing({ target: users.email });

  return { id: newId, name: body.clientName || body.name || "Guest", email };
}

async function resolveAmount(_body: any, artistId: string | null): Promise<string> {
  if (artistId) {
    const [artist] = await db
      .select({ price: profiles.price })
      .from(profiles)
      .where(and(eq(profiles.userId, artistId), eq(profiles.role, "artist")))
      .limit(1);
    if (artist?.price) return String(artist.price);
  }
  return "0";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, studioId, serviceId, date, time, status } = body;
    const artistIdStr = artistId ? String(artistId) : null;

    const session = await getAuthSession();
    const customer = await ensureCustomer(body, session);
    if (!customer || !date) {
      return NextResponse.json(
        { error: "clientEmail and date are required" },
        { status: 400 }
      );
    }

    const amount = await resolveAmount(body, artistIdStr);

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: customer.id,
        artistId: artistIdStr,
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

    const artist = artistIdStr
      ? await db.select().from(profiles).where(and(eq(profiles.userId, artistIdStr), eq(profiles.role, "artist"))).limit(1).then((r) => r[0])
      : undefined;

    const providerUser = artist?.userId
      ? await db.select().from(users).where(eq(users.id, artist.userId)).limit(1).then((r) => r[0])
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
      providerName: providerUser?.name || artist?.bio || "Your Provider",
      date: formattedDate,
      time: time || "To be confirmed",
      amount: Number(amount),
      paymentType: "full",
    }).catch((err) => console.error("sendBookingConfirmationEmail failed:", err));

    if (providerUser?.email) {
      sendProviderNewBookingEmail({
        email: providerUser.email,
        providerName: providerUser.name || "Your Provider",
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
          const [referrer] = await db
            .select({ userId: profiles.userId })
            .from(profiles)
            .where(and(eq(profiles.slug, String(ref.id)), eq(profiles.role, "artist")))
            .limit(1);
          const referrerOwnerId = referrer?.userId;

          if (referrerOwnerId && referrerOwnerId !== customer.id) {
            const [existingReferral] = await db
              .select({ id: referrals.id, status: referrals.status })
              .from(referrals)
              .where(and(
                eq(referrals.referrerType, "artist"),
                eq(referrals.referrerUserId, referrerOwnerId),
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
                referrerUserId: referrerOwnerId,
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
                    eq(referrals.referrerUserId, referrerOwnerId),
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
    const artistUsers = alias(users, "artist_users");

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

      if (session && !hasAdminAccess(session) && booking.userId !== session.id) {
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
          .select({ name: users.name })
          .from(profiles)
          .innerJoin(users, eq(users.id, profiles.userId))
          .where(and(eq(profiles.userId, booking.artistId), eq(profiles.role, "artist")))
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
      if (!hasAdminAccess(session) && session.id !== userId) {
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
          artistName: artistUsers.name,
        })
        .from(bookings)
        .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
        .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
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

    if (!hasAdminAccess(session)) {
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
            .select({ name: users.name })
            .from(profiles)
            .innerJoin(users, eq(users.id, profiles.userId))
            .where(and(eq(profiles.userId, b.artistId), eq(profiles.role, "artist")))
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const allowedStatuses = ["confirmed", "cancelled", "completed"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, Number(id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing.userId !== session.id && existing.artistId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, Number(id)))
      .returning();

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
