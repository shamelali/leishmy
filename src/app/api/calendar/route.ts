import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, artists, studios } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
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
          .select({ userId: artists.userId })
          .from(artists)
          .where(eq(artists.id, Number(artistId)))
          .limit(1);
        if (!artist || artist.userId !== session.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      if (studioId) {
        const [studio] = await db
          .select({ userId: studios.userId })
          .from(studios)
          .where(eq(studios.id, Number(studioId)))
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
      studioId ? eq(bookings.studioId, Number(studioId)) : eq(bookings.artistId, Number(artistId)),
      gte(bookings.date, start),
      lt(bookings.date, end),
    );

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
        artistName: artists.name,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(artists, eq(bookings.artistId, artists.id))
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
