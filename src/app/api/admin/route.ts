import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, artists, studios, bookings, payments, adminSettings, contacts, receivedEmails, webhookEvents } from "@/db/schema";
import { eq, count, and, gte, lt, avg, sql, desc } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { prefixedEnvReader } from "@/lib/env-prefix";

const billplz = prefixedEnvReader("BILLPLZ_");

function billplzAuth() {
  return `Basic ${Buffer.from(billplz.require("API_KEY") + ":").toString("base64")}`;
}
function billplzApiUrl() {
  return billplz.get("API_URL");
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
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        userResult, artistResult, studioResult, bookingResult, paymentRows,
        newUsersResult, newArtistsResult, newBookingsResult,
        newUsersLastMonthResult, newArtistsLastMonthResult,         newBookingsLastMonthResult,
        ratingResult,
        pendingVerificationResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(artists),
        db.select({ count: count() }).from(studios),
        db.select({ count: count() }).from(bookings),
        db.select().from(payments),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, startOfMonth)),
        db.select({ count: count() }).from(artists).where(gte(artists.createdAt, startOfMonth)),
        db.select({ count: count() }).from(bookings).where(gte(bookings.createdAt, startOfMonth)),
        db.select({ count: count() }).from(users).where(and(gte(users.createdAt, startOfLastMonth), lt(users.createdAt, startOfMonth))),
        db.select({ count: count() }).from(artists).where(and(gte(artists.createdAt, startOfLastMonth), lt(artists.createdAt, startOfMonth))),
        db.select({ count: count() }).from(bookings).where(and(gte(bookings.createdAt, startOfLastMonth), lt(bookings.createdAt, startOfMonth))),
        db.select({ avg: avg(sql`CAST(${artists.rating} AS DECIMAL)`) }).from(artists),
        db.select({ count: count() }).from(artists).where(eq(artists.status, "pending_verification")),
      ]);

      const paidPayments = paymentRows.filter((p) => p.status === "paid" || p.status === "released");

      const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const revenueThisMonth = paidPayments
        .filter((p) => p.createdAt && p.createdAt >= startOfMonth)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const revenueLastMonth = paidPayments
        .filter((p) => p.createdAt && p.createdAt >= startOfLastMonth && p.createdAt < startOfMonth)
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
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
        avgRating,
        pendingPayouts: totalPendingPayouts,
        newUsersThisMonth: newUsersResult[0]?.count || 0,
        newUsersLastMonth: newUsersLastMonthResult[0]?.count || 0,
        newArtistsThisMonth: newArtistsResult[0]?.count || 0,
        newArtistsLastMonth: newArtistsLastMonthResult[0]?.count || 0,
        newBookingsThisMonth: newBookingsResult[0]?.count || 0,
        newBookingsLastMonth: newBookingsLastMonthResult[0]?.count || 0,
        pendingVerification: pendingVerificationResult[0]?.count || 0,
        commissionRate: 0.15,
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
        db.select({
          id: bookings.id,
          date: bookings.date,
          time: bookings.time,
          status: bookings.status,
          amount: bookings.amount,
          notes: bookings.notes,
          location: bookings.location,
          userId: bookings.userId,
          artistId: bookings.artistId,
          userName: users.name,
          artistName: artists.name,
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id))
        .leftJoin(artists, eq(bookings.artistId, artists.id))
        .limit(pageSize).offset(offset),
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
          userName: b.userName || "—",
          artistName: b.artistName || "—",
          notes: b.notes || "",
          location: b.location || "",
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

    if (action === "pending-artists") {
      const [rows, [{ count: total }]] = await Promise.all([
        db.select().from(artists).where(eq(artists.status, "pending_verification")).orderBy(desc(artists.createdAt)).limit(pageSize).offset(offset),
        db.select({ count: count() }).from(artists).where(eq(artists.status, "pending_verification")),
      ]);
      return NextResponse.json({
        artists: rows.map((a) => ({
          id: String(a.id),
          name: a.name,
          slug: a.slug,
          email: a.email || "",
          phone: a.phone || "",
          location: a.location || "",
          image: a.image || "",
          bio: a.bio || "",
          rating: a.rating || "0",
          price: a.price || "0",
          specialties: a.specialties || [],
          languages: a.languages || [],
          experience: a.experience || 0,
          verified: a.verified || false,
          createdAt: a.createdAt?.toISOString() || "",
        })),
        total, page, pageSize,
      });
    }

    if (action === "moderation") {
      const contactRows = await db.select().from(contacts).orderBy(contacts.createdAt).limit(50);

      const items: { id: number; type: string; from: string; target: string; reason: string; status: string; date: string }[] = [];

      for (const c of contactRows) {
        items.push({
          id: c.id,
          type: "contact",
          from: c.name,
          target: c.email,
          reason: c.message.slice(0, 200),
          status: "pending",
          date: c.createdAt?.toISOString().split("T")[0] || "",
        });
      }

      items.sort((a, b) => b.date.localeCompare(a.date));

      return NextResponse.json({ items });
    }

    if (action === "settings") {
      const rows = await db.select().from(adminSettings);
      const settings: Record<string, string> = {};
      for (const row of rows) {
        settings[row.key] = row.value;
      }
      return NextResponse.json({ settings });
    }

    if (action === "received-emails") {
      const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 200);
      const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
      const [rows, totalResult] = await Promise.all([
        db.select()
          .from(receivedEmails)
          .orderBy(desc(receivedEmails.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(receivedEmails),
      ]);
      return NextResponse.json({
        emails: rows,
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      });
    }

    if (action === "webhooks") {
      const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "50")));
      const events = await db
        .select()
        .from(webhookEvents)
        .orderBy(desc(webhookEvents.createdAt))
        .limit(limit);

      const allPayments = await db.select().from(payments);

      // Flag payments that are still "pending" but have a Billplz bill we can
      // re-check, so the dashboard can surface "paid but webhook missed" cases.
      const pendingOrHeld = allPayments.filter(
        (p) => p.billplzId && (p.status === "pending" || p.status === "held"),
      );

      const reconcile: { paymentId: number; billplzId: string | null; billplzPaid: boolean | null; localStatus: string | null }[] = [];
      for (const p of pendingOrHeld) {
        let billplzPaid: boolean | null = null;
        try {
          const res = await fetch(`${billplzApiUrl()}/bills/${p.billplzId}`, {
            headers: { Authorization: billplzAuth() },
          });
          if (res.ok) {
            const data = await res.json();
            billplzPaid = Boolean(data.paid_at);
          }
        } catch {
          billplzPaid = null;
        }
        reconcile.push({
          paymentId: p.id,
          billplzId: p.billplzId,
          billplzPaid,
          localStatus: p.status,
        });
      }

      const rejected = events.filter((e) => e.status === "rejected").length;

      return NextResponse.json({
        events: events.map((e) => ({
          id: e.id,
          event: e.event,
          status: e.status,
          createdAt: e.createdAt?.toISOString() || "",
          payload: e.payload,
        })),
        reconcile,
        summary: {
          total: events.length,
          received: events.filter((e) => e.status === "received").length,
          rejected,
        },
      });
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

    if (action === "create-artist") {
      const { name, slug, email, phone, location, image, bio, price, verified } = body;
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      const artistSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const [artist] = await db
        .insert(artists)
        .values({
          name,
          slug: artistSlug,
          email: email || null,
          phone: phone || null,
          location: location || null,
          image: image || null,
          bio: bio || null,
          price: price ? String(price) : "0",
          verified: verified ?? true,
          available: true,
        })
        .returning();
      return NextResponse.json({ success: true, artist });
    }

    if (action === "approve-artist") {
      const { artistId } = body;
      if (!artistId) {
        return NextResponse.json({ error: "artistId required" }, { status: 400 });
      }
      await db
        .update(artists)
        .set({ status: "verified", verified: true, rejectionReason: null })
        .where(eq(artists.id, Number(artistId)));
      return NextResponse.json({ success: true });
    }

    if (action === "reject-artist") {
      const { artistId, reason } = body;
      if (!artistId) {
        return NextResponse.json({ error: "artistId required" }, { status: 400 });
      }
      await db
        .update(artists)
        .set({ status: "rejected", verified: false, rejectionReason: reason || null })
        .where(eq(artists.id, Number(artistId)));
      return NextResponse.json({ success: true });
    }

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

    if (action === "set-role") {
      const { userId, role } = body;
      if (!userId || !role) {
        return NextResponse.json({ error: "userId and role required" }, { status: 400 });
      }
      if (!["admin", "artist", "studio", "client"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      await db.update(users).set({ role }).where(eq(users.id, userId));
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

    if (action === "resolve-item") {
      const { id, type } = body;
      if (!id || !type) {
        return NextResponse.json({ error: "id and type required" }, { status: 400 });
      }
      if (type === "contact") {
        await db.delete(contacts).where(eq(contacts.id, Number(id)));
      } else {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "settings") {
      const entries = body.settings as Record<string, string>;
      if (!entries) {
        return NextResponse.json({ error: "settings object required" }, { status: 400 });
      }

      await db.transaction(async (tx) => {
        for (const [key, value] of Object.entries(entries)) {
          await tx
            .insert(adminSettings)
            .values({ key, value })
            .onConflictDoUpdate({ target: adminSettings.key, set: { value, updatedAt: new Date() } });
        }
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reconcile-payment") {
      const { paymentId } = body;
      if (!paymentId) {
        return NextResponse.json({ error: "paymentId required" }, { status: 400 });
      }
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, Number(paymentId)))
        .limit(1);
      if (!payment || !payment.billplzId) {
        return NextResponse.json({ error: "Payment not found or has no Billplz bill" }, { status: 404 });
      }
      const res = await fetch(`${billplzApiUrl()}/bills/${payment.billplzId}`, {
        headers: { Authorization: billplzAuth() },
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Billplz lookup failed" }, { status: 502 });
      }
      const data = await res.json();
      const billplzPaid = Boolean(data.paid_at);
      let updated = false;
      if (billplzPaid && payment.status !== "paid") {
        await db
          .update(payments)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
        if (payment.bookingId) {
          await db
            .update(bookings)
            .set({ status: "completed", updatedAt: new Date() })
            .where(eq(bookings.id, payment.bookingId));
        }
        updated = true;
      }
      return NextResponse.json({ success: true, billplzPaid, localStatus: payment.status, updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
