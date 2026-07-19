import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getAuthSession } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studioId = searchParams.get("studioId");
    const artistId = searchParams.get("artistId");
    const month = searchParams.get("month");

    if (!month || (!studioId && !artistId)) {
      return NextResponse.json({ error: "month and studioId or artistId required" }, { status: 400 });
    }

    if (session.role !== "admin") {
      if (artistId) {
        const [artist] = await db
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(and(eq(profiles.userId, artistId), eq(profiles.role, "artist")))
          .limit(1);
        if (!artist || artist.userId !== session.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      if (studioId) {
        const [studio] = await db
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(and(eq(profiles.userId, studioId), eq(profiles.role, "studio")))
          .limit(1);
        if (!studio || studio.userId !== session.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const m = Number(monthStr);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);

    const where = and(
      studioId ? eq(bookings.studioId, studioId) : eq(bookings.artistId, artistId!),
      gte(bookings.date, start),
      lt(bookings.date, end),
    );

    const artistUsers = alias(users, "artist_users");

    const rows = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        status: bookings.status,
        amount: bookings.amount,
        userId: bookings.userId,
        artistId: bookings.artistId,
        clientName: users.name,
        artistName: artistUsers.name,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
      .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
      .where(where)
      .orderBy(bookings.date, bookings.time);

    const events = rows.map((b) => ({
      id: b.id,
      day: b.date.getDate(),
      date: b.date.toISOString().split("T")[0],
      time: b.time || "",
      status: b.status || "pending",
      amount: b.amount,
      client: b.clientName || "Guest",
      artist: b.artistName || "",
    }));

    return NextResponse.json({ events, month });
  } catch (error) {
    console.error("Calendar GET error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
