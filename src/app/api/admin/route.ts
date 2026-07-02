import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, artists, studios, bookings, payments } from "@/db/schema";
import { eq, count, and, gte, avg, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!action || action === "overview") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [userResult, artistResult, studioResult, bookingResult, paymentRows, newUsersResult, ratingResult] =
        await Promise.all([
          db.select({ count: count() }).from(users),
          db.select({ count: count() }).from(artists),
          db.select({ count: count() }).from(studios),
          db.select({ count: count() }).from(bookings),
          db.select().from(payments),
          db.select({ count: count() }).from(users).where(gte(users.createdAt, startOfMonth)),
          db.select({ avg: avg(sql`CAST(${artists.rating} AS DECIMAL)`) }).from(artists),
        ]);

      const revenue = paymentRows
        .filter((p) => p.status === "paid" || p.status === "released")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const totalPendingPayouts = paymentRows
        .filter((p) => p.status === "held")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const avgRating = ratingResult[0]?.avg ? Number(Number(ratingResult[0].avg).toFixed(1)) : 0;

      return NextResponse.json({
        totalUsers: userResult[0]?.count || 0,
        totalArtists: artistResult[0]?.count || 0,
        totalStudios: studioResult[0]?.count || 0,
        totalBookings: bookingResult[0]?.count || 0,
        revenue,
        avgRating,
        pendingPayouts: totalPendingPayouts,
        newUsersThisMonth: newUsersResult[0]?.count || 0,
      });
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(Math.max(1, Number(searchParams.get("pageSize")) || 20), 100);
    const offset = (page - 1) * pageSize;

    if (action === "artists") {
      const [rows, [{ count: total }]] = await Promise.all([
        db.select().from(artists).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(artists),
      ]);
      return NextResponse.json({
        artists: rows.map((a) => ({
          id: String(a.id),
          name: a.name,
          email: a.email || "",
          phone: a.phone || "",
          location: a.location || "",
          rating: a.rating || "0",
          reviewCount: a.reviewCount || 0,
          verified: a.verified || false,
          available: a.available ?? true,
          createdAt: a.createdAt?.toISOString() || "",
        })),
        total, page, pageSize,
      });
    }

    if (action === "studios") {
      const [rows, [{ count: total }]] = await Promise.all([
        db.select().from(studios).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(studios),
      ]);
      return NextResponse.json({
        studios: rows.map((s) => ({
          id: String(s.id),
          name: s.name,
          email: s.email || "",
          phone: s.phone || "",
          location: s.location || "",
          rating: s.rating || "0",
          createdAt: s.createdAt?.toISOString() || "",
        })),
        total, page, pageSize,
      });
    }

    if (action === "users") {
      const [rows, [{ count: total }]] = await Promise.all([
        db.select().from(users).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(users),
      ]);
      return NextResponse.json({
        users: rows.map((u) => ({
          id: u.id,
          name: u.name || "",
          email: u.email,
          role: u.role || "client",
          image: u.image || "",
          createdAt: u.createdAt?.toISOString() || "",
        })),
        total, page, pageSize,
      });
    }

    if (action === "bookings") {
      const [rows, [{ count: total }]] = await Promise.all([
        db.select().from(bookings).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(bookings),
      ]);
      return NextResponse.json({
        bookings: rows.map((b) => ({
          id: String(b.id),
          date: b.date?.toISOString() || "",
          time: b.time || "",
          status: b.status || "pending",
          paymentStatus: "pending",
          totalAmount: b.amount || "0",
          userName: b.userId,
          artistName: "",
        })),
        total, page, pageSize,
      });
    }

    if (action === "payments") {
      const [rows, [{ count: total }]] = await Promise.all([
        db.select().from(payments).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(payments),
      ]);
      return NextResponse.json({
        payments: rows.map((p) => ({
          id: String(p.id),
          amount: String(p.amount),
          status: p.status || "pending",
          paymentMethod: p.method || "billplz",
          createdAt: p.createdAt?.toISOString() || "",
          releasedAt: p.updatedAt?.toISOString() || "",
          bookingId: String(p.bookingId || ""),
        })),
        total, page, pageSize,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "toggle-verify") {
      const { artistId, verified } = body;
      if (artistId) {
        await db
          .update(artists)
          .set({ verified })
          .where(eq(artists.id, Number(artistId)));
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete-artist") {
      const { artistId } = body;
      if (artistId) {
        await db
          .delete(artists)
          .where(eq(artists.id, Number(artistId)));
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
