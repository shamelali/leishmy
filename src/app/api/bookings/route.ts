import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications, referrals, services } from "@/db/schema";
import { eq, and, count, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { sendBookingReceivedEmail, sendProviderNewBookingEmail, sendQuoteReadyEmail } from "@/lib/email";
import { sendCancellationNotice } from "@/lib/notifications/whatsapp";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { awardPoints } from "@/lib/loyalty";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createBookingSchema, updateBookingSchema, addQuoteSchema, acceptQuoteSchema, rejectQuoteSchema, updateBookingPriceSchema } from "@/lib/validations/bookings";

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

    if (existing) return existing;

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

async function resolveAmount(
  serviceId: number | string | null,
  artistId: string | null,
  studioId: string | null,
): Promise<{ amount: string; serviceName: string } | { error: string }> {
  if (!serviceId) {
    return { error: "serviceId is required — price must be resolved from a specific service" };
  }

  const [service] = await db
    .select({ id: services.id, name: services.name, price: services.price, artistId: services.artistId, studioId: services.studioId })
    .from(services)
    .where(eq(services.id, Number(serviceId)))
    .limit(1);

  if (!service) {
    return { error: "Selected service not found" };
  }

  // Ensure the service actually belongs to the provider being booked
  const belongsToArtist = artistId && service.artistId === artistId;
  const belongsToStudio = studioId && service.studioId === studioId;
  if (!belongsToArtist && !belongsToStudio) {
    return { error: "Selected service does not belong to this provider" };
  }

  return { amount: String(service.price), serviceName: service.name };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { artistId, studioId, serviceId, date, time } = parsed.data;
    const artistIdStr = artistId ? String(artistId) : null;
    const serviceIdNum = serviceId ? Number(serviceId) : null;
    const studioIdStr = studioId ? String(studioId) : null;

    const session = await getAuthSession();
    const customer = await ensureCustomer(body, session);
    if (!customer || !date) {
      return NextResponse.json(
        { error: "clientEmail and date are required" },
        { status: 400 }
      );
    }

    // For quote_pending, we don't need to resolve amount yet
    // Just get service name if serviceId provided
    let serviceName = body.service || "Service Request";
    if (serviceIdNum) {
      const [service] = await db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, serviceIdNum))
        .limit(1);
      if (service) serviceName = service.name;
    }

    // Check for scheduling conflicts
    if (artistIdStr) {
      const [conflict] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.artistId, artistIdStr),
            eq(bookings.date, new Date(date)),
            eq(bookings.time, time ?? null as unknown as string),
            inArray(bookings.status, ["pending", "confirmed", "quote_pending", "quote_sent"]),
          ),
        )
        .limit(1);
      if (conflict) {
        return NextResponse.json(
          { error: "Artist is already booked for this date and time" },
          { status: 409 },
        );
      }
    } else if (studioIdStr) {
      const [conflict] = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.studioId, studioIdStr),
            eq(bookings.date, new Date(date)),
            eq(bookings.time, time ?? null as unknown as string),
            inArray(bookings.status, ["pending", "confirmed", "quote_pending", "quote_sent"]),
          ),
        )
        .limit(1);
      if (conflict) {
        return NextResponse.json(
          { error: "Studio is already booked for this date and time" },
          { status: 409 },
        );
      }
    }

    // Create booking with quote_pending status
    const [booking] = await db
      .insert(bookings)
      .values({
        userId: customer.id,
        artistId: artistIdStr,
        studioId: studioId ? String(studioId) : null,
        serviceId: serviceId || null,
        service: serviceName,
        notes: body.notes || null,
        location: body.location || null,
        placeId: body.placeId || null,
        date: new Date(date),
        time: time || null,
        amount: "0", // Will be set when quote is added
        depositAmount: "0",
        milestone: "quote_pending",
        status: "quote_pending",
      })
      .returning();

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

    // Notify MUA of new quote request
    if (artist?.userId) {
      await db.insert(notifications).values({
        userId: artist.userId,
        type: "quote_request",
        title: "New Quote Request",
        body: `${customer.name || "A customer"} requested "${serviceName}" on ${formattedDate}${time ? ` at ${time}` : ""}. Please review and provide a quote.`,
        data: { link: "/dashboard/artist/quotes", bookingId: String(booking.id) },
      }).catch(() => {});
    }

    // Notify studio of new quote request
    if (studio?.userId) {
      await db.insert(notifications).values({
        userId: studio.userId,
        type: "quote_request",
        title: "New Quote Request",
        body: `${customer.name || "A customer"} requested "${serviceName}" on ${formattedDate}${time ? ` at ${time}` : ""}. Please review and provide a quote.`,
        data: { link: "/dashboard/studio/quotes", bookingId: String(booking.id) },
      }).catch(() => {});
    }

    // Email customer confirmation
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
    }).catch((err) => console.error("sendBookingReceivedEmail failed:", err));

    // Email provider (artist or studio)
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

      const isOwner = booking.userId === session?.id;
      const isAssignedArtist = !!booking.artistId && booking.artistId === session?.id;
      const isAssignedStudio = !!booking.studioId && booking.studioId === session?.id;
      if (session && !hasAdminAccess(session) && !isOwner && !isAssignedArtist && !isAssignedStudio) {
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

    // Price breakdown update (artist/studio editing fees)
    if (body.amount !== undefined || body.travelSurcharge !== undefined || body.accommodationFee !== undefined || body.depositAmount !== undefined) {
      const parsed = updateBookingPriceSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { id, amount, depositAmount, travelSurcharge, accommodationFee } = parsed.data;

      const [existing] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(id)))
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      // Only the assigned artist/studio or admin can update pricing
      const isAssignedProvider = existing.artistId === session.id || existing.studioId === session.id;
      if (!isAssignedProvider && !hasAdminAccess(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updateData: Record<string, any> = {};
      if (amount !== undefined) updateData.amount = String(amount);
      if (depositAmount !== undefined) updateData.depositAmount = String(depositAmount);
      if (travelSurcharge !== undefined) updateData.travelSurcharge = String(travelSurcharge);
      if (accommodationFee !== undefined) updateData.accommodationFee = String(accommodationFee);
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

    const allowedStatuses = ["cancelled"];
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
        { error: "Cannot cancel a completed booking" },
        { status: 400 }
      );
    }

    if (existing.userId !== session.id && existing.artistId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, Number(id)))
      .returning();

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

    revalidatePath("/bookings");
    revalidatePath("/dashboard/artist");
    revalidatePath("/bookings/" + id);

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}