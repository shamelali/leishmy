import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, artists, studios, bookings, payments } from "@/db/schema";
import { eq, count, and, gte, avg, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/auth";

async function getAuthSession(): Promise<{ id: string; email: string; role: string } | null> {
  const session = await getSession();
  if (!session?.user) return null;
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!dbUser) return null;
  return { id: dbUser.id, email: dbUser.email, role: dbUser.role || "customer" };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (action === "recent-activity") {
      const [recentUsers, recentArtists, recentBookings] = await Promise.all([
        db.select({ id: users.id, name: users.name, createdAt: users.createdAt })
          .from(users).orderBy(users.createdAt).limit(5),
        db.select({ id: artists.id, name: artists.name, createdAt: artists.createdAt, verified: artists.verified })
          .from(artists).orderBy(artists.createdAt).limit(5),
        db.select({ id: bookings.id, status: bookings.status, amount: bookings.amount, createdAt: bookings.createdAt })
          .from(bookings).orderBy(bookings.createdAt).limit(5),
      ]);

      const activity: { action: string; detail: string; time: string; type: string }[] = [];

      for (const u of recentUsers) {
        activity.push({ action: "New user registered", detail: u.name || "Anonymous", time: timeAgo(u.createdAt), type: "user" });
      }
      for (const a of recentArtists) {
        const verb = a.verified ? "verified" : "joined";
        activity.push({ action: `Artist ${verb}`, detail: a.name || "Unknown", time: timeAgo(a.createdAt), type: "artist" });
      }
      for (const b of recentBookings) {
        const verb = b.status === "completed" ? "completed" : b.status === "confirmed" ? "confirmed" : "created";
        activity.push({ action: `Booking ${verb}`, detail: `MYR ${b.amount || 0}`, time: timeAgo(b.createdAt), type: "booking" });
      }

      activity.sort((a, b) => {
        const aMin = parseTimeAgo(a.time);
        const bMin = parseTimeAgo(b.time);
        return aMin - bMin;
      });

      return NextResponse.json({ activity: activity.slice(0, 6) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

function timeAgo(date: Date | null | undefined): string {
  if (!date) return "recently";
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function parseTimeAgo(time: string): number {
  if (time.includes("just now")) return 0;
  const num = parseInt(time) || 0;
  if (time.includes("min")) return num;
  if (time.includes("hour")) return num * 60;
  if (time.includes("day")) return num * 1440;
  return 999;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
