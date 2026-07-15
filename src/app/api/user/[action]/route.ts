import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/db";
import { users, favorites, notifications, bookings, artists, studios, categories, artistCategories, referrals } from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";
import { getSession } from "@/lib/auth/auth";
import { isAllowedImageUrl } from "@/lib/utils/upload-url";
import { revalidatePath } from "next/cache";

const MAX_PORTFOLIO_ITEMS = 12;
const MAX_URL_LENGTH = 500;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const { action } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (action === "favorites") {
      const rows = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, userId));

      return NextResponse.json({ favorites: rows });
    }

    if (action === "notifications") {
      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(notifications.createdAt);

      return NextResponse.json({ notifications: rows });
    }

    if (action === "bookings") {
      let rows;

      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, userId))
        .limit(1);

      if (artist) {
        rows = await db
          .select()
          .from(bookings)
          .where(eq(bookings.artistId, artist.id));
      } else {
        const [studio] = await db
          .select()
          .from(studios)
          .where(eq(studios.userId, userId))
          .limit(1);

        if (studio) {
          rows = await db
            .select()
            .from(bookings)
            .where(eq(bookings.studioId, studio.id));
        } else {
          rows = await db
            .select()
            .from(bookings)
            .where(eq(bookings.userId, userId));
        }
      }

      const clientUserIds = (rows || []).map((b) => b.userId).filter(Boolean);
      const clientRows = clientUserIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, clientUserIds))
        : [];
      const clientNameMap = new Map(clientRows.map((u) => [u.id, u.name || "Anonymous"]));

      const enrichedBookings = (rows || []).map((b) => ({
        ...b,
        id: String(b.id),
        client: clientNameMap.get(b.userId) || "Anonymous",
        userName: clientNameMap.get(b.userId) || "Anonymous",
        price: Number(b.amount) || 0,
      }));

      return NextResponse.json({
        bookings: enrichedBookings,
      });
    }

    if (action === "artist-profile") {
      const [row] = await db
        .select({
          artist: artists,
          userName: users.name,
          userEmail: users.email,
        })
        .from(artists)
        .leftJoin(users, eq(users.id, artists.userId))
        .where(eq(artists.userId, userId))
        .limit(1);

      if (!row || !row.artist) {
        return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
      }

      const artist = row.artist;

      return NextResponse.json({
        artist: {
          id: String(artist.id),
          name: row.userName || artist.name,
          email: row.userEmail || artist.email || "",
          slug: artist.slug,
          image: artist.image || "",
          phone: artist.phone || "",
          location: artist.location || "",
          area: artist.area || "",
          district: artist.district || "",
          bio: artist.bio || "",
          experience: artist.experience || 0,
          languages: artist.languages || [],
          specialties: (artist.specialties as string[] | null) || [],
          responseTime: artist.responseTime || "",
          price: Number(artist.price) || 0,
          portfolio: artist.portfolio || [],
          verified: artist.verified || false,
          available: artist.available ?? true,
          instagramUrl: artist.instagramUrl || "",
          tiktokUrl: artist.tiktokUrl || "",
          certifications: artist.certifications || "",
          availability: artist.availability || "",
        },
      });
    }

    if (action === "studio-profile") {
      const [studio] = await db
        .select()
        .from(studios)
        .where(eq(studios.userId, userId))
        .limit(1);

      if (!studio) {
        return NextResponse.json({ error: "Studio profile not found" }, { status: 404 });
      }

      return NextResponse.json({
        studio: {
          id: String(studio.id),
          name: studio.name,
          slug: studio.slug,
          image: studio.image || "",
          phone: studio.phone || "",
          location: studio.location || "",
          email: studio.email || "",
          description: studio.description || "",
          price: Number(studio.price) || 0,
          rating: studio.rating || "0",
          reviewCount: studio.reviewCount || 0,
          featured: studio.featured || false,
        },
      });
    }

    if (action === "studio-staff") {
      const studioId = searchParams.get("studioId");
      if (!studioId) {
        return NextResponse.json({ error: "studioId required" }, { status: 400 });
      }

      const rows = await db
        .select()
        .from(artists)
        .where(eq(artists.studioId, Number(studioId)));

      return NextResponse.json({
        staff: rows.map((a) => ({
          id: String(a.id),
          name: a.name,
          email: a.email || "",
          phone: a.phone || "",
          image: a.image || "",
          location: a.location || "",
          rating: a.rating || "0",
          reviewCount: a.reviewCount || 0,
          verified: a.verified || false,
          available: a.available ?? true,
        })),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const { action } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (action === "create-profile") {
      const name = body.name || "";
      const email = (body.email || "").toLowerCase();
      const userRole = body.role || "customer";
      const userPhone = body.phone || "";
      const userLocation = body.location || "Kuala Lumpur, Malaysia";

      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const [existingById] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingById) {
        await db
          .update(users)
          .set({ name, email, role: userRole, phone: userPhone, location: userLocation })
          .where(eq(users.id, userId));
        return NextResponse.json({ success: true });
      }

      const [existingByEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingByEmail) {
        return NextResponse.json({ error: "Email already registered. Please sign in." }, { status: 409 });
      }

      const avatar = `https://images.unsplash.com/photo-${
        userRole === "artist" ? "1534528741775-53994a69daeb" : "1544005313-94ddf0286df2"
      }?w=150&h=150&fit=crop`;

      await db.insert(users).values({
        id: userId,
        name,
        email,
        role: userRole,
        phone: userPhone,
        location: userLocation,
        avatar,
      });

      if (userRole === "artist") {
        const slug =
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
          "-" +
          userId.slice(-5);

        const [newArtist] = await db
          .insert(artists)
          .values({
            name,
            slug,
            email,
            image: avatar,
            phone: userPhone,
            location: userLocation,
            bio: "",
            available: true,
            verified: false,
            userId,
          })
          .returning();

        const specialties: string[] = body.specialties || [];
        const specialtyToSlug: Record<string, string> = {
          "Bridal Makeup": "bridal",
          "Soft Glam": "event",
          "Editorial / Photoshoot": "editorial",
          "Hijab Styling": "hijab",
          "Airbrush Makeup": "airbrush",
          "SFX / Creative": "sfx",
          Hairstyling: "hair",
        };

        const categorySlugs = specialties
          .map((s: string) => specialtyToSlug[s])
          .filter(Boolean);

        if (categorySlugs.length > 0) {
          const matchedCategories = await db
            .select({ id: categories.id })
            .from(categories)
            .where(inArray(categories.slug, categorySlugs));

          if (matchedCategories.length > 0) {
            await db.insert(artistCategories).values(
              matchedCategories.map((c) => ({
                artistId: newArtist.id,
                categoryId: c.id,
              })),
            );
          }
        }
      }

      if (userRole === "studio") {
        const slug =
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
          "-" +
          userId.slice(-5);

        await db.insert(studios).values({
          name,
          slug,
          email,
          image: avatar,
          phone: userPhone,
          location: userLocation,
          description: "",
          userId,
        });
      }

      const refCookie = request.cookies.get("leish_ref");
      if (refCookie?.value) {
        try {
          const ref = JSON.parse(refCookie.value);
          if (ref?.t && ref?.id && (ref.t === "artist" || ref.t === "studio")) {
            const referrerOwnerId = ref.t === "artist"
              ? await db.select({ uid: artists.userId }).from(artists).where(eq(artists.id, Number(ref.id))).limit(1).then(r => r[0]?.uid)
              : await db.select({ uid: studios.userId }).from(studios).where(eq(studios.id, Number(ref.id))).limit(1).then(r => r[0]?.uid);

            if (referrerOwnerId && referrerOwnerId !== userId) {
              const referrerIdNum = Number(ref.id);
              const [existing] = await db
                .select()
                .from(referrals)
                .where(and(
                  eq(referrals.referrerType, ref.t),
                  eq(referrals.referrerId, referrerIdNum),
                  eq(referrals.referredEmail, email),
                ))
                .limit(1);

              if (existing) {
                await db.update(referrals).set({
                  referredUserId: userId,
                  status: "registered",
                  registeredAt: new Date(),
                }).where(eq(referrals.id, existing.id));
              } else {
                await db.insert(referrals).values({
                  referrerType: ref.t,
                  referrerId: referrerIdNum,
                  referredUserId: userId,
                  referredEmail: email,
                  status: "registered",
                  registeredAt: new Date(),
                });
              }
            }
          }
        } catch {
          // invalid referral cookie - ignore silently
        }
      }

      const roleForEmail = userRole === "customer" ? "client" : (userRole as "client" | "artist" | "studio");
      sendWelcomeEmail({ email, name, role: roleForEmail }).catch((err) => {
        console.error("sendWelcomeEmail failed:", err);
        Sentry.captureException(err, { extra: { email, name, role: roleForEmail, context: "create-profile" } });
      });

      return NextResponse.json({ success: true });
    }

    if (action === "favorites") {
      const { artistId } = body;

      if (body.add === false) {
        await db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userId, userId),
              eq(favorites.artistId, Number(artistId)),
            ),
          );
        return NextResponse.json({ success: true, favorited: false });
      }

      const [existing] = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, userId),
            eq(favorites.artistId, Number(artistId)),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(favorites).values({
          userId,
          artistId: Number(artistId),
        });
      }

      return NextResponse.json({ success: true, favorited: true });
    }

    if (action === "notifications") {
      const notifAction = body.action;
      const notificationId = body.notificationId;

      if (notifAction === "mark-read" && notificationId) {
        await db
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.id, Number(notificationId)),
              eq(notifications.userId, userId),
            ),
          );
      } else if (notifAction === "mark-all-read") {
        await db
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.userId, userId),
              isNull(notifications.readAt),
            ),
          );
      } else if (notifAction === "clear-all") {
        await db
          .delete(notifications)
          .where(eq(notifications.userId, userId));
      }

      return NextResponse.json({ success: true });
    }

    if (action === "profile") {
      const updateData: Record<string, unknown> = {};
      const allowedFields = ["name", "phone", "location", "bio"];
      for (const field of allowedFields) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, userId));
      }

      return NextResponse.json({ success: true });
    }

    if (action === "artist-profile") {
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, userId))
        .limit(1);

      if (!artist) {
        return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};
      const allowedFields = [
        "image",
        "bio",
        "experience",
        "languages",
        "responseTime",
        "price",
        "location",
        "phone",
        "area",
        "district",
        "specialties",
        "instagramUrl",
        "tiktokUrl",
        "certifications",
        "availability",
      ];
      for (const field of allowedFields) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }

      if (body.specialties !== undefined) {
        if (!Array.isArray(body.specialties)) {
          return NextResponse.json(
            { error: "specialties must be an array of strings" },
            { status: 400 },
          );
        }
        if (
          body.specialties.some(
            (s: unknown) => typeof s !== "string" || s.length > 60,
          )
        ) {
          return NextResponse.json(
            { error: "Each specialty must be a string under 60 characters" },
            { status: 400 },
          );
        }
        updateData.specialties = body.specialties;
      }

      if (body.languages !== undefined) {
        if (!Array.isArray(body.languages)) {
          return NextResponse.json(
            { error: "languages must be an array of strings" },
            { status: 400 },
          );
        }
        if (
          body.languages.some(
            (s: unknown) => typeof s !== "string" || s.length > 40,
          )
        ) {
          return NextResponse.json(
            { error: "Each language must be a string under 40 characters" },
            { status: 400 },
          );
        }
        updateData.languages = body.languages;
      }

      for (const urlField of ["instagramUrl", "tiktokUrl"] as const) {
        if (body[urlField] !== undefined && body[urlField] !== "") {
          if (
            typeof body[urlField] !== "string" ||
            body[urlField].length > MAX_URL_LENGTH ||
            !isAllowedImageUrl(body[urlField])
          ) {
            return NextResponse.json(
              { error: `${urlField} must be a valid HTTPS URL on an allowlisted host` },
              { status: 400 },
            );
          }
        }
      }

      if (body.portfolio !== undefined) {
        if (!Array.isArray(body.portfolio)) {
          return NextResponse.json(
            { error: "portfolio must be an array of URLs" },
            { status: 400 },
          );
        }
        if (body.portfolio.length > MAX_PORTFOLIO_ITEMS) {
          return NextResponse.json(
            { error: `portfolio can contain at most ${MAX_PORTFOLIO_ITEMS} items` },
            { status: 400 },
          );
        }
        for (const url of body.portfolio) {
          if (typeof url !== "string" || url.length > MAX_URL_LENGTH) {
            return NextResponse.json(
              { error: "Each portfolio item must be a string URL under 500 characters" },
              { status: 400 },
            );
          }
          if (!isAllowedImageUrl(url)) {
            return NextResponse.json(
              { error: "Portfolio URLs must be HTTPS and on an allowlisted host" },
              { status: 400 },
            );
          }
        }
        updateData.portfolio = body.portfolio;
      }

      const userUpdateData: Record<string, unknown> = {};
      if (typeof body.name === "string" && body.name.trim()) {
        userUpdateData.name = body.name.trim().slice(0, 255);
      }
      if (
        typeof body.email === "string" &&
        body.email.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      ) {
        userUpdateData.email = body.email.trim().toLowerCase().slice(0, 255);
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await db
          .update(artists)
          .set(updateData)
          .where(eq(artists.userId, userId));
      }

      if (Object.keys(userUpdateData).length > 0) {
        await db
          .update(users)
          .set(userUpdateData)
          .where(eq(users.id, userId));
      }

      return NextResponse.json({ success: true });
    }

    if (action === "confirm-booking") {
      const { bookingId } = body;
      if (!bookingId) {
        return NextResponse.json({ error: "bookingId required" }, { status: 400 });
      }
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(bookingId)))
        .limit(1);
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (booking.status !== "pending") {
        return NextResponse.json({ error: "Only pending bookings can be confirmed" }, { status: 400 });
      }
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, userId))
        .limit(1);
      if (!artist || booking.artistId !== artist.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      await db
        .update(bookings)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(bookings.id, Number(bookingId)));
      revalidatePath("/dashboard/artist");
      return NextResponse.json({ success: true });
    }

    if (action === "reject-booking") {
      const { bookingId } = body;
      if (!bookingId) {
        return NextResponse.json({ error: "bookingId required" }, { status: 400 });
      }
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, Number(bookingId)))
        .limit(1);
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (booking.status !== "pending") {
        return NextResponse.json({ error: "Only pending bookings can be rejected" }, { status: 400 });
      }
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, userId))
        .limit(1);
      if (!artist || booking.artistId !== artist.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      await db
        .update(bookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(bookings.id, Number(bookingId)));
      revalidatePath("/dashboard/artist");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("User POST error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const { action } = await params;

    if (action === "favorites") {
      const body = await request.json().catch(() => ({}));
      const { artistId } = body;
      const userId = searchParams.get("userId");

      if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 });
      }

      if (artistId) {
        await db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userId, userId),
              eq(favorites.artistId, Number(artistId)),
            ),
          );
      }

      return NextResponse.json({ success: true, favorited: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
