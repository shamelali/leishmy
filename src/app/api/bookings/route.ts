import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications, referrals, services, payouts, payments, invoices } from "@/db/schema";
import { eq, and, or, ilike, count, desc, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendBookingReceivedEmail, sendProviderNewBookingEmail, sendBookingCompletedEmail } from "@/lib/email";
import { sendCancellationNotice } from "@/lib/notifications/whatsapp";
import { sendPushNotification } from "@/lib/notifications/push";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { awardPoints } from "@/lib/loyalty";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createBookingSchema, updateBookingSchema, updateBookingPriceSchema } from "@/lib/validations/bookings";
import { MIN_BOOKING_AMOUNT, MAX_BOOKING_AMOUNT } from "@/lib/constants";
import { rateLimitApi } from "@/lib/rate-limit-api";
import {
  AppError,
  correlationIdFrom,
  isUniqueViolation,
  logCaught,
  withSerializableTransaction,
  withTimeout,
} from "@/lib/db-utils";
import { clampDepositPercent, depositCentsFromTotal, fromCents, myrString, toCents } from "@/lib/money";
import { bookingDateFromInput, findConflictingBooking } from "@/lib/booking-slot";

const NOTIFY_TIMEOUT_MS = 5_000;

function jsonWithCorrelation(
  correlationId: string,
  body: unknown,
  status = 200,
): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set("x-correlation-id", correlationId);
  return res;
}

export const runtime = "nodejs";

async function ensureCustomer(
  body: any,
  session: { id: string; name?: string | null; email: string } | null,
): Promise<{ id: string; name: string | null; email: string; phone: string | null } | null> {
  const email = (body.clientEmail || body.email || session?.email || "").toLowerCase();
  if (!email) return null;

  if (session?.id) {
    const existing = await db
      .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1)
      .then((r) => r[0]);

    if (existing) {
      // Neon Auth is the source of truth for the logged-in user's email.
      // public."user" can drift (registration may have started outside Neon Auth,
      // or the email changed there), and every transactional emailer reads it.
      // Prefer session.email here so booking confirmations land at the real address.
      return { ...existing, email: session.email ?? existing.email };
    }

    await db.insert(users).values({
      id: session.id,
      name: session.name || body.clientName || body.name || "Customer",
      email,
      role: "customer",
      phone: body.phone || body.clientPhone || null,
      location: body.location || "",
    }).onConflictDoNothing({ target: users.email });

    return { id: session.id, name: session.name || body.clientName || body.name || "Customer", email, phone: body.phone || body.clientPhone || null };
  }

  const existing = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
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
    phone: body.phone || body.clientPhone || null,
    location: body.location || "",
  }).onConflictDoNothing({ target: users.email });

  return { id: newId, name: body.clientName || body.name || "Guest", email, phone: body.phone || body.clientPhone || null };
}

export async function POST(request: NextRequest) {
  const correlationId = correlationIdFrom(request);
  const limited = await rateLimitApi(request, { max: 10, window: 60 });
  if (limited) {
    limited.headers.set("x-correlation-id", correlationId);
    return limited;
  }

  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonWithCorrelation(
        correlationId,
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    const { artistId, studioId, serviceId, date, time } = parsed.data;
    const artistIdStr = artistId ? String(artistId) : null;
    const serviceIdNum = serviceId ? Number(serviceId) : null;
    const studioIdStr = studioId ? String(studioId) : null;

    const session = await getAuthSession();
    const customer = await ensureCustomer(body, session);
    if (!customer || !date) {
      return jsonWithCorrelation(
        correlationId,
        { error: "clientEmail and date are required" },
        400,
      );
    }

    // Resolve service price and provider deposit percent for server-side amount calculation
    let serviceName = parsed.data.service || body.service || "Service Request";
    let servicePriceCents = 0;
    let depositPercent = 30;
    if (serviceIdNum) {
      const [service] = await db
        .select({ name: services.name, price: services.price })
        .from(services)
        .where(eq(services.id, serviceIdNum))
        .limit(1);
      if (service) {
        serviceName = service.name;
        servicePriceCents = toCents(service.price);
      }
    }

    // Resolve provider's default deposit percent
    const providerUserId = artistIdStr ? artistIdStr : studioIdStr;
    if (providerUserId) {
      const [providerProfile] = await db
        .select({ defaultDepositPercent: profiles.defaultDepositPercent })
        .from(profiles)
        .where(eq(profiles.userId, providerUserId))
        .limit(1);
      if (providerProfile?.defaultDepositPercent) {
        depositPercent = clampDepositPercent(providerProfile.defaultDepositPercent);
      }
    }

    const servicePriceMyr = fromCents(servicePriceCents);
    const depositAmount = myrString(depositCentsFromTotal(servicePriceCents, depositPercent));

    if (servicePriceCents > 0) {
      if (servicePriceMyr < MIN_BOOKING_AMOUNT || servicePriceMyr > MAX_BOOKING_AMOUNT) {
        return jsonWithCorrelation(
          correlationId,
          { error: `Service price must be between ${MIN_BOOKING_AMOUNT} and ${MAX_BOOKING_AMOUNT}` },
          400,
        );
      }
    }

    const bookingDate = bookingDateFromInput(date);

    // Pre-flight availability check (best-effort; re-checked under the lock)
    const preflightConflict = await findConflictingBooking(db, {
      artistId: artistIdStr,
      studioId: studioIdStr,
      date: bookingDate,
      time: time || null,
    });
    if (preflightConflict) {
      return jsonWithCorrelation(
        correlationId,
        { error: "This time slot is no longer available" },
        409,
      );
    }

    let booking;
    try {
      booking = await withSerializableTransaction(async (tx) => {
        const conflict = await findConflictingBooking(tx, {
          artistId: artistIdStr,
          studioId: studioIdStr,
          date: bookingDate,
          time: time || null,
        });
        if (conflict) {
          throw new AppError(409, "This time slot is no longer available");
        }

        const [created] = await tx
          .insert(bookings)
          .values({
            userId: customer.id,
            artistId: artistIdStr,
            studioId: studioIdStr,
            serviceId: serviceId || null,
            service: serviceName,
            notes: parsed.data.notes || body.notes || null,
            location: parsed.data.location || body.location || null,
            placeId: parsed.data.placeId || body.placeId || null,
            date: bookingDate,
            time: time || null,
            amount: myrString(servicePriceCents),
            depositAmount: servicePriceCents > 0 ? depositAmount : null,
            milestone: servicePriceCents === 0 ? null : `deposit_${depositPercent}`,
            status: servicePriceCents === 0 ? "quote_pending" : "requested",
          })
          .returning();

        return created;
      }, { correlationId });
    } catch (err) {
      if (err instanceof AppError) {
        return jsonWithCorrelation(correlationId, { error: err.message }, err.status);
      }
      if (isUniqueViolation(err)) {
        return jsonWithCorrelation(
          correlationId,
          { error: "This time slot is no longer available" },
          409,
        );
      }
      throw err;
    }

    const artist = artistIdStr
      ? await db.select().from(profiles).where(and(eq(profiles.userId, artistIdStr), eq(profiles.role, "artist"))).limit(1).then((r) => r[0])
      : undefined;

    const studio = studioIdStr
      ? await db.select().from(profiles).where(and(eq(profiles.userId, studioIdStr), eq(profiles.role, "studio"))).limit(1).then((r) => r[0])
      : undefined;

    const providerUser = artist?.userId
      ? await db.select().from(users).where(eq(users.id, artist.userId)).limit(1).then((r) => r[0])
      : studio?.userId
        ? await db.select().from(users).where(eq(users.id, studio.userId)).limit(1).then((r) => r[0])
        : undefined;

    const formattedDate = new Date(date).toLocaleDateString("en-MY", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // Notify MUA of new booking request
    if (artist?.userId) {
      await withTimeout(
        db.insert(notifications).values({
          userId: artist.userId,
          type: "booking_request",
          title: "New Booking Request",
          body: `${customer.name || "A customer"} requested "${serviceName}" on ${formattedDate}${time ? ` at ${time}` : ""}. Accept or send a custom quote.`,
          data: { link: `/bookings/${booking.id}`, bookingId: String(booking.id) },
        }),
        NOTIFY_TIMEOUT_MS,
        "booking_request_artist",
        correlationId,
      );
      void withTimeout(
        sendPushNotification(artist.userId, {
          title: "New Booking Request",
          body: `${customer.name || "A customer"} requested "${serviceName}" on ${formattedDate}.`,
          url: `/bookings/${booking.id}`,
        }),
        NOTIFY_TIMEOUT_MS,
        "push_booking_request_artist",
        correlationId,
      );
    }

    // Notify studio of new booking request
    if (studio?.userId) {
      await withTimeout(
        db.insert(notifications).values({
          userId: studio.userId,
          type: "booking_request",
          title: "New Booking Request",
          body: `${customer.name || "A customer"} requested "${serviceName}" on ${formattedDate}${time ? ` at ${time}` : ""}. Accept or send a custom quote.`,
          data: { link: "/dashboard/studio/bookings", bookingId: String(booking.id) },
        }),
        NOTIFY_TIMEOUT_MS,
        "booking_request_studio",
        correlationId,
      );
      void withTimeout(
        sendPushNotification(studio.userId, {
          title: "New Booking Request",
          body: `${customer.name || "A customer"} requested "${serviceName}" on ${formattedDate}.`,
          url: "/dashboard/studio/bookings",
        }),
        NOTIFY_TIMEOUT_MS,
        "push_booking_request_studio",
        correlationId,
      );
    }

    // Email customer confirmation — never block the HTTP response
    void withTimeout(
      sendBookingReceivedEmail({
        email: customer.email,
        customerName: customer.name || "Valued Customer",
        bookingId: String(booking.id),
        serviceName,
        providerName: providerUser?.name || artist?.bio || "Your Provider",
        date: formattedDate,
        time: time || "To be confirmed",
        amount: 0,
        paymentType: "deposit",
      }),
      NOTIFY_TIMEOUT_MS,
      "email_booking_received",
      correlationId,
    );

    // Email provider (artist or studio)
    if (providerUser?.email) {
      void withTimeout(
        sendProviderNewBookingEmail({
          email: providerUser.email,
          providerName: providerUser.name || "Your Provider",
          customerName: customer.name || "A customer",
          bookingId: String(booking.id),
          serviceName,
          date: formattedDate,
          time: time || "To be confirmed",
        }),
        NOTIFY_TIMEOUT_MS,
        "email_provider_new_booking",
        correlationId,
      );
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

                await withTimeout(
                  db.insert(notifications).values({
                    userId: referrerOwnerId,
                    type: "loyalty",
                    title: "🎉 Referral Reward!",
                    body: `You earned ${pointsAwarded} loyalty points from a referral booking!`,
                    data: { link: "/dashboard/artist/share", pointsAwarded: String(pointsAwarded) },
                  }),
                  NOTIFY_TIMEOUT_MS,
                  "referral_reward",
                  correlationId,
                );
              }
            }
          }
        }
      } catch {
        // invalid referral cookie - ignore silently
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        id: String(booking.id),
        clientName: customer.name || "",
        clientEmail: customer.email || "",
        artistName: providerUser?.name || "",
      },
    });
  } catch (error) {
    console.error("Booking error:", error, error instanceof Error ? error.stack : null);
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
     const artistId = searchParams.get("artistId");
     const page = Math.max(1, Number(searchParams.get("page")) || 1);
     const pageSize = Math.min(Number(searchParams.get("limit")) || 20, 100);
     const offset = (page - 1) * pageSize;
     const search = searchParams.get("search") || "";
     const startDate = searchParams.get("startDate") || "";
     const endDate = searchParams.get("endDate") || "";

    if (id) {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(id)))
        .limit(1);

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const isOwner = booking.userId === session?.id;
      const isAssignedArtist = !!booking.artistId && booking.artistId === session?.id;
      const isAssignedStudio = !!booking.studioId && booking.studioId === session?.id;
      const isGuestBooking = booking.userId?.startsWith("guest_") ?? false;

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (!hasAdminAccess(session) && !isOwner && !isAssignedArtist && !isAssignedStudio) {
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
      
      // Build where conditions for filtering
      const whereConditions = [eq(bookings.userId, userId)];
      
      // Add search filter if provided
      if (search) {
        const searchTerm = `%${search}%`;
        whereConditions.push(
          or(
            ilike(users.name, searchTerm),
            ilike(artistUsers.name, searchTerm),
            ilike(bookings.service, searchTerm)
          )!
        );
      }
      
      // Add date range filters if provided
      if (startDate) {
        whereConditions.push(gte(bookings.date, new Date(startDate)));
      }
      
      if (endDate) {
        whereConditions.push(lte(bookings.date, new Date(endDate)));
      }

      const userWhereClause = whereConditions.length > 1 ? and(...whereConditions)! : whereConditions[0];
      
      const [totalResult] = await db
        .select({ count: count() })
        .from(bookings)
        .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
        .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
        .where(userWhereClause);
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
          placeId: bookings.placeId,
          date: bookings.date,
          time: bookings.time,
          amount: bookings.amount,
          depositAmount: bookings.depositAmount,
          milestone: bookings.milestone,
          secondPaymentDueDate: bookings.secondPaymentDueDate,
          lateFeeCharged: bookings.lateFeeCharged,
          noShow: bookings.noShow,
          travelSurcharge: bookings.travelSurcharge,
          accommodationFee: bookings.accommodationFee,
          remainingPaymentSent: bookings.remainingPaymentSent,
          status: bookings.status,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          artistName: artistUsers.name,
        })
        .from(bookings)
        .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
        .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
        .where(userWhereClause)
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

    if (artistId) {
      if (!hasAdminAccess(session) && session?.id !== artistId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      // Build where conditions for filtering
      const whereConditions = [eq(bookings.artistId, artistId)];
      
      // Add search filter if provided
      if (search) {
        const searchTerm = `%${search}%`;
        whereConditions.push(
          or(
            ilike(users.name, searchTerm),
            ilike(bookings.service, searchTerm)
          )!
        );
      }
      
      // Add date range filters if provided
      if (startDate) {
        whereConditions.push(gte(bookings.date, new Date(startDate)));
      }
      
      if (endDate) {
        whereConditions.push(lte(bookings.date, new Date(endDate)));
      }

      const artistWhereClause = whereConditions.length > 1 ? and(...whereConditions)! : whereConditions[0];
      
      const [totalResult] = await db
        .select({ count: count() })
        .from(bookings)
        .leftJoin(artistUsers, eq(bookings.userId, artistUsers.id))
        .where(artistWhereClause);
      const total = totalResult?.count ?? 0;
      const artistBookings = await db
        .select({
          id: bookings.id,
          userId: bookings.userId,
          artistId: bookings.artistId,
          studioId: bookings.studioId,
          serviceId: bookings.serviceId,
          service: bookings.service,
          notes: bookings.notes,
          location: bookings.location,
          placeId: bookings.placeId,
          date: bookings.date,
          time: bookings.time,
          amount: bookings.amount,
          depositAmount: bookings.depositAmount,
          milestone: bookings.milestone,
          secondPaymentDueDate: bookings.secondPaymentDueDate,
          lateFeeCharged: bookings.lateFeeCharged,
          noShow: bookings.noShow,
          travelSurcharge: bookings.travelSurcharge,
          accommodationFee: bookings.accommodationFee,
          remainingPaymentSent: bookings.remainingPaymentSent,
          status: bookings.status,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          clientName: artistUsers.name,
        })
        .from(bookings)
        .leftJoin(artistUsers, eq(bookings.userId, artistUsers.id))
        .where(artistWhereClause)
        .orderBy(desc(bookings.createdAt))
        .limit(pageSize)
        .offset(offset);
      return NextResponse.json({
        bookings: artistBookings.map(b => ({
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

    // Build where conditions for filtering
    const whereConditions = [];
    
    // Add search filter if provided
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          ilike(users.name, searchTerm),
          ilike(bookings.service, searchTerm)
        )!
      );
    }
    
    // Add date range filters if provided
    if (startDate) {
      whereConditions.push(gte(bookings.date, new Date(startDate)));
    }
    
    if (endDate) {
      whereConditions.push(lte(bookings.date, new Date(endDate)));
    }

    const adminWhereClause = whereConditions.length > 1
      ? and(...whereConditions)!
      : whereConditions.length === 1
      ? whereConditions[0]
      : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
      .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
      .where(adminWhereClause);
    const total = totalResult?.count ?? 0;
    const rawBookings = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
      .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
      .where(adminWhereClause)
      .limit(pageSize)
      .offset(offset);

    const allBookings = await Promise.all(
      rawBookings.map(async (row) => {
        const b = row.bookings;
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
  const correlationId = correlationIdFrom(request);
  const limited = await rateLimitApi(request, { max: 20, window: 60 });
  if (limited) {
    limited.headers.set("x-correlation-id", correlationId);
    return limited;
  }

  try {
    const session = await getAuthSession();
    if (!session) {
      return jsonWithCorrelation(correlationId, { error: "Unauthorized" }, 401);
    }

    const body = await request.json();

    // Price breakdown update (artist/studio editing fees)
    if (body.amount !== undefined || body.travelSurcharge !== undefined || body.accommodationFee !== undefined || body.depositAmount !== undefined) {
      const parsed = updateBookingPriceSchema.safeParse(body);
      if (!parsed.success) {
        return jsonWithCorrelation(
          correlationId,
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          400,
        );
      }

      const { id, amount, depositAmount, travelSurcharge, accommodationFee } = parsed.data;

      if (amount !== undefined) {
        const num = fromCents(toCents(amount));
        if (num < MIN_BOOKING_AMOUNT || num > MAX_BOOKING_AMOUNT) {
          return jsonWithCorrelation(
            correlationId,
            { error: `Amount must be between ${MIN_BOOKING_AMOUNT} and ${MAX_BOOKING_AMOUNT}` },
            400,
          );
        }
      }

      const [existing] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(id)))
        .limit(1);

      if (!existing) {
        return jsonWithCorrelation(correlationId, { error: "Booking not found" }, 404);
      }

      // Only the assigned artist/studio or admin can update pricing
      const isAssignedProvider = existing.artistId === session.id || existing.studioId === session.id;
      if (!isAssignedProvider && !hasAdminAccess(session)) {
        return jsonWithCorrelation(correlationId, { error: "Forbidden" }, 403);
      }

      const updateData: Record<string, unknown> = {};
      if (amount !== undefined) updateData.amount = myrString(toCents(amount));
      if (depositAmount !== undefined) updateData.depositAmount = myrString(toCents(depositAmount));
      if (travelSurcharge !== undefined) updateData.travelSurcharge = myrString(toCents(travelSurcharge));
      if (accommodationFee !== undefined) updateData.accommodationFee = myrString(toCents(accommodationFee));
      if (amount !== undefined || travelSurcharge !== undefined || accommodationFee !== undefined) {
        const svcCents =
          toCents(amount ?? existing.amount)
          - toCents(travelSurcharge ?? existing.travelSurcharge)
          - toCents(accommodationFee ?? existing.accommodationFee);
        updateData.servicePrice = myrString(Math.max(0, svcCents));
      }
      updateData.updatedAt = new Date();

      const [updated] = await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, Number(id)))
        .returning();

      revalidatePath("/bookings/" + id);
      return NextResponse.json({ booking: updated });
    }

    // Status update (cancellation)
    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { id, status } = parsed.data;

    const allowedStatuses = ["cancelled", "completed", "in_progress"];
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

    if (existing.status === "completed") {
      return NextResponse.json(
        { error: "Cannot modify a completed booking" },
        { status: 400 }
      );
    }

    if (existing.userId !== session.id && existing.artistId !== session.id && existing.studioId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only provider can set in_progress
    if (status === "in_progress" && existing.artistId !== session.id && existing.studioId !== session.id) {
      return NextResponse.json({ error: "Only the provider can start a service" }, { status: 403 });
    }

    // Only provider can mark completed
    if (status === "completed" && existing.artistId !== session.id && existing.studioId !== session.id) {
      return NextResponse.json({ error: "Only the provider can complete a service" }, { status: 403 });
    }

    const updateData: Record<string, any> = { status };
    if (status === "cancelled") {
  updateData.lateFeeCharged =
    existing.secondPaymentDueDate
      ? existing.secondPaymentDueDate < new Date()
      : false;
    }

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, Number(id)))
      .returning();

    // Notify customer when service starts
    if (status === "in_progress" && existing.userId) {
      await withTimeout(
        db.insert(notifications).values({
          userId: existing.userId,
          type: "service_started",
          title: "Service In Progress",
          body: `Your "${existing.service}" service with ${existing.artistId ? "your artist" : "your studio"} has started.`,
          data: { link: `/bookings/${updated.id}`, bookingId: String(updated.id) },
        }),
        NOTIFY_TIMEOUT_MS,
        "service_started",
        correlationId,
      );
      void withTimeout(
        sendPushNotification(existing.userId, {
          title: "Service In Progress",
          body: `Your "${existing.service}" service has started.`,
          url: `/bookings/${updated.id}`,
        }),
        NOTIFY_TIMEOUT_MS,
        "push_service_started",
        correlationId,
      );
    }

    if (status === "cancelled" && existing.userId) {
      const isNoShow =
        existing.status === "confirmed" || existing.status === "completed";
      const depositForfeited = isNoShow || existing.lateFeeCharged;

      const [user] = await db
        .select({ name: users.name, phone: users.phone })
        .from(users)
        .where(eq(users.id, existing.userId))
        .limit(1);

      if (user?.phone) {
        if (depositForfeited) {
          sendCancellationNotice({
            customerName: user.name || "Valued Customer",
            bookingId: String(updated.id),
            phone: user.phone,
            depositForfeited: true,
          }).catch((err) =>
            console.error("sendCancellationNotice WhatsApp failed:", err)
          );
        } else {
          sendCancellationNotice({
            customerName: user.name || "Valued Customer",
            bookingId: String(updated.id),
            phone: user.phone,
          }).catch((err) =>
            console.error("sendCancellationNotice WhatsApp failed:", err)
          );
        }
      }
    }

    if (status === "completed" && existing.userId) {
      const recipientId = existing.artistId || existing.studioId;

      if (recipientId) {
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.bookingId, Number(id)))
          .limit(1);

        if (payment) {
          await db
            .update(payments)
            .set({ status: "released", updatedAt: new Date() })
            .where(eq(payments.id, payment.id));

          await db.insert(payouts).values({
            userId: recipientId,
            amount: payment.amount,
            status: "pending",
            paymentId: payment.id,
          });

          await db.insert(notifications).values({
            userId: recipientId,
            type: "payout_released",
            title: "Payment Released from Escrow",
            body: `MYR ${(payment.amount / 100).toLocaleString()} has been released from escrow. It is now pending payout to your bank account.`,
            data: { link: "/dashboard/artist" },
          });
        }

        await awardPoints(
          existing.userId,
          "booking_completed",
          String(updated.id),
          `Booking #${updated.id} completed`
        );

        // Auto-generate invoice for completed booking
        const [existingInvoice] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.bookingId, Number(id)))
          .limit(1);

        if (!existingInvoice) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const invoiceNumber = `INV-${year}${month}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

          let serviceName = existing.service || "Service";
          if (existing.serviceId) {
            const [svc] = await db
              .select({ name: services.name })
              .from(services)
              .where(eq(services.id, existing.serviceId))
              .limit(1);
            if (svc) serviceName = svc.name;
          }

          const subtotalCents = toCents(existing.amount);
          const commissionRate = 0.08;
          const commissionCents = Math.round(subtotalCents * commissionRate);
          const travelCents = toCents(existing.travelSurcharge);
          const stayCents = toCents(existing.accommodationFee);

          const lineItems = [
            {
              description: serviceName,
              quantity: 1,
              unitPrice: fromCents(subtotalCents),
              amount: fromCents(subtotalCents),
            },
          ];
          if (travelCents > 0) {
            lineItems.push({
              description: "Travel surcharge",
              quantity: 1,
              unitPrice: fromCents(travelCents),
              amount: fromCents(travelCents),
            });
          }
          if (stayCents > 0) {
            lineItems.push({
              description: "Accommodation fee",
              quantity: 1,
              unitPrice: fromCents(stayCents),
              amount: fromCents(stayCents),
            });
          }

          await db.insert(invoices).values({
            invoiceNumber,
            bookingId: Number(id),
            issuerId: recipientId,
            recipientId: existing.userId,
            subtotal: myrString(subtotalCents),
            commissionAmount: myrString(commissionCents),
            commissionRate: String(commissionRate),
            total: myrString(subtotalCents),
            status: "issued",
            lineItems,
            issuedAt: new Date(),
          });
        }

        // Prompt customer to leave a review
        await withTimeout(
          db.insert(notifications).values({
            userId: existing.userId,
            type: "review_prompt",
            title: "How was your experience?",
            body: `Your "${existing.service}" service is complete! Share your feedback and help others find great ${existing.artistId ? "artists" : "studios"}.`,
            data: { link: `/bookings/${updated.id}#review`, bookingId: String(updated.id) },
          }),
          NOTIFY_TIMEOUT_MS,
          "review_prompt",
          correlationId,
        );
        void withTimeout(
          sendPushNotification(existing.userId, {
            title: "Leave a Review",
            body: `Your "${existing.service}" service is complete! Rate your experience.`,
            url: `/bookings/${updated.id}#review`,
          }),
          NOTIFY_TIMEOUT_MS,
          "push_review_prompt",
          correlationId,
        );

        // Send completion email with review link
        const [customerUser] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, existing.userId))
          .limit(1);
        const providerName = existing.artistId ? "your artist" : "your studio";
        if (customerUser?.email) {
          sendBookingCompletedEmail({
            email: customerUser.email,
            customerName: customerUser.name || "Customer",
            bookingId: String(updated.id),
            serviceName: existing.service || "Service",
            providerName,
          }).catch(() => {});
        }
      }
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");
    revalidatePath("/dashboard/studio");
    revalidatePath("/bookings/" + id);

    return jsonWithCorrelation(correlationId, { booking: updated });
  } catch (error) {
    logCaught("bookings.update", error, { correlationId });
    return jsonWithCorrelation(correlationId, { error: "Failed to update booking" }, 500);
  }
}
