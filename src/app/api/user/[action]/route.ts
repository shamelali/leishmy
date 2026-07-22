import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/db";
import {
  users,
  profiles,
  favorites,
  notifications,
  bookings,
  categories,
  referrals,
} from "@/db/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/email";
import { getSession } from "@/lib/auth/auth";
import { isAllowedImageUrl } from "@/lib/utils/upload-url";
import { revalidatePath } from "next/cache";

const MAX_PORTFOLIO_ITEMS = 12;
const MAX_URL_LENGTH = 500;

// Map a user-friendly specialty label to a category slug so we can record
// the artist's categories on their single `profiles` row.
const specialtyToSlug: Record<string, string> = {
  "Bridal Makeup": "bridal",
  "Soft Glam": "event",
  "Editorial / Photoshoot": "editorial",
  "Hijab Styling": "hijab",
  "Airbrush Makeup": "airbrush",
  "SFX / Creative": "sfx",
  Hairstyling: "hair",
};

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

      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.userId, userId)))
        .limit(1);

      if (profile && (profile.role === "artist" || profile.role === "studio")) {
        rows = await db
          .select()
          .from(bookings)
          .where(
            profile.role === "artist"
              ? eq(bookings.artistId, userId)
              : eq(bookings.studioId, userId),
          );
      } else {
        rows = await db
          .select()
          .from(bookings)
          .where(eq(bookings.userId, userId));
      }

      const clientUserIds = (rows || []).map((b) => b.userId).filter(Boolean);
      const clientRows =
        clientUserIds.length > 0
          ? await db.select().from(users).where(inArray(users.id, clientUserIds))
          : [];
      const clientNameMap = new Map(
        clientRows.map((u) => [u.id, u.name || "Anonymous"]),
      );

      const clientEmailMap = new Map(
        clientRows.map((u) => [u.id, u.email || ""]),
      );
      const clientPhoneMap = new Map(
        clientRows.map((u) => [u.id, u.phone || ""]),
      );

      const enrichedBookings = (rows || []).map((b) => ({
        ...b,
        id: String(b.id),
        client: clientNameMap.get(b.userId) || "Anonymous",
        userName: clientNameMap.get(b.userId) || "Anonymous",
        clientEmail: clientEmailMap.get(b.userId) || "",
        clientPhone: clientPhoneMap.get(b.userId) || "",
        price: Number(b.amount) || 0,
      }));

      return NextResponse.json({
        bookings: enrichedBookings,
      });
    }

    if (action === "artist-profile") {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.userId, userId), eq(profiles.role, "artist")))
        .limit(1);

      if (!profile) {
        return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
      }

      const [userRow] = await db
        .select({ name: users.name, email: users.email, image: users.image, phone: users.phone, location: users.location })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return NextResponse.json({
        artist: {
          id: profile.userId,
          name: userRow?.name || "",
          email: userRow?.email || "",
          slug: profile.slug || "",
          image: userRow?.image || "",
          phone: userRow?.phone || "",
          area:
            profile.area ||
            (userRow?.location && !profile.district
              ? (userRow.location.split(", ")[1] || userRow.location)
              : ""),
          district:
            profile.district ||
            (userRow?.location ? userRow.location.split(", ")[0] || "" : ""),
          location: profile.area || profile.district ? userRow?.location || "" : "",
          bio: profile.bio || "",
          experience: profile.experience || 0,
          languages: profile.languages || [],
          specialties: (
            (profile.specialties as string[] | null)?.length
              ? (profile.specialties as string[])
              : (profile.categories as string[] | null) || []
          ),
          categories: profile.categories || [],
          responseTime: profile.responseTime || "",
          price: Number(profile.price) || 0,
          portfolio: profile.portfolio || [],
          verified: profile.verified || false,
          available: profile.available ?? true,
          instagramUrl: profile.instagramUrl || "",
          tiktokUrl: profile.tiktokUrl || "",
          certifications: profile.certifications || "",
          availability: profile.availability || "",
        },
      });
    }

    if (action === "studio-profile") {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.userId, userId), eq(profiles.role, "studio")))
        .limit(1);

      if (!profile) {
        return NextResponse.json({ error: "Studio profile not found" }, { status: 404 });
      }

      const [userRow] = await db
        .select({ name: users.name, email: users.email, image: users.image, phone: users.phone, location: users.location })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return NextResponse.json({
        studio: {
          id: profile.userId,
          name: userRow?.name || "",
          slug: profile.slug || "",
          image: userRow?.image || "",
          phone: userRow?.phone || "",
          location: userRow?.location || "",
          email: userRow?.email || "",
          description: profile.description || "",
          price: Number(profile.price) || 0,
          rating: profile.rating || "0",
          reviewCount: profile.reviewCount || 0,
          featured: profile.featured || false,
        },
      });
    }

    if (action === "studio-staff") {
      const studioId = searchParams.get("studioId");
      if (!studioId) {
        return NextResponse.json({ error: "studioId required" }, { status: 400 });
      }

      const [studio] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, studioId), eq(profiles.role, "studio")))
        .limit(1);

      if (!studio || studio.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const rows = await db
        .select({
          userId: profiles.userId,
          slug: profiles.slug,
          area: profiles.area,
          rating: profiles.rating,
          reviewCount: profiles.reviewCount,
          verified: profiles.verified,
          available: profiles.available,
          name: users.name,
          email: users.email,
          phone: users.phone,
          image: users.image,
        })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(and(eq(profiles.studioId, studioId), eq(profiles.role, "artist")));

      return NextResponse.json({
        staff: rows.map((a) => ({
          id: a.userId,
          name: a.name || a.slug || a.userId,
          email: a.email || "",
          phone: a.phone || "",
          image: a.image || "",
          location: a.area || "",
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
      const userLocation = body.location || "Cyberjaya, Malaysia";

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

      const slug =
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
        "-" +
        userId.slice(-5);

      const [regDistrict, regArea] = userLocation.split(", ");

      const profileValues: Record<string, unknown> = {
        userId,
        role: userRole,
        status: "draft",
        slug,
        available: true,
        verified: false,
        district: regDistrict || "",
        area: regArea || userLocation,
      };

      if (userRole === "artist") {
        const specialties: string[] = body.specialties || [];
        profileValues.specialties = specialties;
        const categorySlugs = specialties
          .map((s: string) => specialtyToSlug[s])
          .filter(Boolean);

        if (categorySlugs.length > 0) {
          const matched = await db
            .select({ slug: categories.slug })
            .from(categories)
            .where(inArray(categories.slug, categorySlugs));
          profileValues.categories = matched.map((c) => c.slug);
        }
      }

      await db
        .insert(profiles)
        .values(profileValues as any)
        .onConflictDoUpdate({
          target: profiles.userId,
          set: { role: userRole, slug, status: "draft" },
        });

      const refCookie = request.cookies.get("leish_ref");
      if (refCookie?.value) {
        try {
          const ref = JSON.parse(refCookie.value);
          if (ref?.t && ref?.id && (ref.t === "artist" || ref.t === "studio")) {
            // Referrer cookie stored the profile slug; resolve to its user_id.
            const [referrer] = await db
              .select({ userId: profiles.userId })
              .from(profiles)
              .where(and(eq(profiles.slug, String(ref.id)), eq(profiles.role, ref.t)))
              .limit(1);

            if (referrer?.userId && referrer.userId !== userId) {
              const [existing] = await db
                .select()
                .from(referrals)
                .where(
                  and(
                    eq(referrals.referrerType, ref.t),
                    eq(referrals.referrerUserId, referrer.userId),
                    eq(referrals.referredEmail, email),
                  ),
                )
                .limit(1);

              if (existing) {
                await db
                  .update(referrals)
                  .set({
                    referredUserId: userId,
                    status: "registered",
                    registeredAt: new Date(),
                  })
                  .where(eq(referrals.id, existing.id));
              } else {
                await db.insert(referrals).values({
                  referrerType: ref.t,
                  referrerUserId: referrer.userId,
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

      const roleForEmail =
        userRole === "customer" ? "client" : (userRole as "client" | "artist" | "studio");
      sendWelcomeEmail({ email, name, role: roleForEmail }).catch((err) => {
        console.error("sendWelcomeEmail failed:", err);
        Sentry.captureException(err, {
          extra: { email, name, role: roleForEmail, context: "create-profile" },
        });
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
              eq(favorites.artistId, String(artistId)),
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
            eq(favorites.artistId, String(artistId)),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(favorites).values({
          userId,
          artistId: String(artistId),
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
          .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
      } else if (notifAction === "clear-all") {
        await db.delete(notifications).where(eq(notifications.userId, userId));
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
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.userId, userId), eq(profiles.role, "artist")))
        .limit(1);

      if (!profile) {
        return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};
      const allowedFields = [
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
      if (typeof body.image === "string") {
        if (body.image === "" || isAllowedImageUrl(body.image)) {
          userUpdateData.image = body.image;
        } else {
          return NextResponse.json(
            { error: "image must be a valid HTTPS URL on an allowlisted host" },
            { status: 400 },
          );
        }
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await db
          .update(profiles)
          .set(updateData)
          .where(and(eq(profiles.userId, userId), eq(profiles.role, "artist")));
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
        .from(profiles)
        .where(and(eq(profiles.userId, userId), eq(profiles.role, "artist")))
        .limit(1);
      if (!artist || booking.artistId !== artist.userId) {
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
        .from(profiles)
        .where(and(eq(profiles.userId, userId), eq(profiles.role, "artist")))
        .limit(1);
      if (!artist || booking.artistId !== artist.userId) {
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
              eq(favorites.artistId, String(artistId)),
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
