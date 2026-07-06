import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studios, artists, bookings, payments, users } from "@/db/schema";
import { eq, ilike, or, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    if (action === "dashboard" && userId) {
      const [studio] = await db
        .select()
        .from(studios)
        .where(eq(studios.userId, userId))
        .limit(1);

      if (!studio) {
        return NextResponse.json({ error: "Studio not found" }, { status: 404 });
      }

      const [artistRows, bookingRows, studioPaymentRows] = await Promise.all([
        db.select().from(artists).where(eq(artists.userId, userId)),
        db
          .select()
          .from(bookings)
          .where(eq(bookings.studioId, studio.id))
          .orderBy(desc(bookings.createdAt))
          .limit(10),
        db.select().from(payments).where(
          inArray(
            payments.bookingId,
            db.select({ id: bookings.id }).from(bookings).where(eq(bookings.studioId, studio.id)),
          ),
        ),
      ]);

      const revenue = studioPaymentRows
        .filter((p) => p.status === "paid" || p.status === "released")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const pendingBalance = studioPaymentRows
        .filter((p) => p.status === "held")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const bookingUserIds = bookingRows.map((b) => b.userId).filter(Boolean);
      const bookingArtistIds = bookingRows.map((b) => b.artistId).filter(Boolean) as number[];

      const [userRows, artistNameRows] = await Promise.all([
        bookingUserIds.length > 0
          ? db.select().from(users).where(inArray(users.id, bookingUserIds))
          : Promise.resolve([]),
        bookingArtistIds.length > 0
          ? db.select().from(artists).where(inArray(artists.id, bookingArtistIds))
          : Promise.resolve([]),
      ]);

      const userMap = new Map(userRows.map((u) => [u.id, u.name || "Anonymous"]));
      const artistNameMap = new Map(artistNameRows.map((a) => [a.id, a.name || "Artist"]));

      const recentBookings = bookingRows.map((b) => ({
        id: String(b.id),
        date: b.date ? new Date(b.date).toLocaleDateString() : "",
        time: b.time || "",
        status: b.status || "pending",
        amount: String(b.amount || 0),
        artistName: artistNameMap.get(b.artistId!) || "",
        userName: userMap.get(b.userId) || "Anonymous",
      }));

      return NextResponse.json({
        studio,
        stats: {
          artists: artistRows.length,
          bookings: bookingRows.length,
          revenue,
          rating: Number(studio.rating) || 0,
          pendingBalance,
        },
        recentBookings,
      });
    }

    const query = db.select().from(studios).limit(limit);

    if (search) {
      query.where(
        or(
          ilike(studios.name, `%${search}%`),
          ilike(studios.location, `%${search}%`),
          ilike(studios.description, `%${search}%`),
        ),
      );
    }

    const rows = await query;

    return NextResponse.json({ studios: rows });
  } catch (error) {
    console.error("Fetch studios error:", error);
    return NextResponse.json({ error: "Failed to fetch studios" }, { status: 500 });
  }
}
