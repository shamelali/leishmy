import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, favorites, notifications, bookings, artists, studios } from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

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
        rating: 4.9,
        reviewCount: 0,
      });
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

      return NextResponse.json({
        artist: {
          id: String(artist.id),
          name: artist.name,
          slug: artist.slug,
          image: artist.image || "",
          phone: artist.phone || "",
          location: artist.location || "",
          bio: artist.bio || "",
          experience: artist.experience || 0,
          languages: artist.languages || [],
          responseTime: artist.responseTime || "",
          price: Number(artist.price) || 0,
          portfolio: artist.portfolio || [],
          verified: artist.verified || false,
          available: artist.available ?? true,
        },
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    if (action === "favorites") {
      const { artistId } = body;

      if (body.add === false || request.method === "DELETE") {
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
        "bio",
        "experience",
        "languages",
        "responseTime",
        "price",
        "location",
        "phone",
      ];
      for (const field of allowedFields) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }

      if (body.portfolio !== undefined) {
        updateData.portfolio = Array.isArray(body.portfolio) ? body.portfolio : [];
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await db
          .update(artists)
          .set(updateData)
          .where(eq(artists.userId, userId));
      }

      return NextResponse.json({ success: true });
    }

    if (action === "confirm-booking") {
      const { bookingId, userId: actionUserId } = body;
      if (!bookingId || !actionUserId) {
        return NextResponse.json({ error: "bookingId and userId required" }, { status: 400 });
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
        .where(eq(artists.userId, actionUserId))
        .limit(1);
      if (!artist || booking.artistId !== artist.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      await db
        .update(bookings)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(bookings.id, Number(bookingId)));
      return NextResponse.json({ success: true });
    }

    if (action === "reject-booking") {
      const { bookingId, userId: actionUserId } = body;
      if (!bookingId || !actionUserId) {
        return NextResponse.json({ error: "bookingId and userId required" }, { status: 400 });
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
        .where(eq(artists.userId, actionUserId))
        .limit(1);
      if (!artist || booking.artistId !== artist.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      await db
        .update(bookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(bookings.id, Number(bookingId)));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("User POST error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    if (action === "favorites") {
      const body = await request.json().catch(() => ({}));
      const { artistId } = body;

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
