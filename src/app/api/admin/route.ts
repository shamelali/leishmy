import { hasAdminAccess } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, profiles, bookings, payments, adminSettings, contacts, receivedEmails, webhookEvents } from "@/db/schema";
import { eq, count, and, gte, lt, avg, sql, desc, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getAuthSession } from "@/lib/auth/server";
import { reconcilePayment } from "@/lib/payment-reconcile";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
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
        db.select({ count: count() }).from(profiles).where(eq(profiles.role, "artist")),
        db.select({ count: count() }).from(profiles).where(eq(profiles.role, "studio")),
        db.select({ count: count() }).from(bookings),
        db.select().from(payments),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, startOfMonth)),
        db.select({ count: count() }).from(profiles).where(and(eq(profiles.role, "artist"), gte(profiles.createdAt, startOfMonth))),
        db.select({ count: count() }).from(bookings).where(gte(bookings.createdAt, startOfMonth)),
        db.select({ count: count() }).from(users).where(and(gte(users.createdAt, startOfLastMonth), lt(users.createdAt, startOfMonth))),
        db.select({ count: count() }).from(profiles).where(and(eq(profiles.role, "artist"), gte(profiles.createdAt, startOfLastMonth), lt(profiles.createdAt, startOfMonth))),
        db.select({ count: count() }).from(bookings).where(and(gte(bookings.createdAt, startOfLastMonth), lt(bookings.createdAt, startOfMonth))),
        db.select({ avg: avg(sql`CAST(${profiles.rating} AS DECIMAL)`) }).from(profiles).where(eq(profiles.role, "artist")),
        db.select({ count: count() }).from(profiles).where(eq(profiles.status, "pending_verification")),
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
      const artistUsers = alias(users, "artist_users");
      const [rows, [{ count: total }]] = await Promise.all([
        db
          .select({
            id: profiles.userId,
            name: artistUsers.name,
            email: artistUsers.email,
            phone: artistUsers.phone,
            location: artistUsers.location,
            rating: profiles.rating,
            reviewCount: profiles.reviewCount,
            verified: profiles.verified,
            available: profiles.available,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .innerJoin(artistUsers, eq(artistUsers.id, profiles.userId))
          .where(eq(profiles.role, "artist"))
          .limit(pageSize).offset(offset),
        db.select({ count: count() }).from(profiles).where(eq(profiles.role, "artist")),
      ]);
      return NextResponse.json({
        artists: rows.map((a) => ({
          id: a.id,
          name: a.name || "",
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
      const studioUsers = alias(users, "studio_users");
      const [rows, [{ count: total }]] = await Promise.all([
        db
          .select({
            id: profiles.userId,
            name: studioUsers.name,
            email: studioUsers.email,
            phone: studioUsers.phone,
            location: studioUsers.location,
            rating: profiles.rating,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .innerJoin(studioUsers, eq(studioUsers.id, profiles.userId))
          .where(eq(profiles.role, "studio"))
          .limit(pageSize).offset(offset),
        db.select({ count: count() }).from(profiles).where(eq(profiles.role, "studio")),
      ]);
      return NextResponse.json({
        studios: rows.map((s) => ({
          id: s.id,
          name: s.name || "",
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

    if (action === "people") {
      const peopleUsers = alias(users, "people_users");
      const roleFilter = searchParams.get("role");
      const statusFilter = searchParams.get("status");
      const searchTerm = searchParams.get("search")?.trim();

      const filters = [];
      if (roleFilter) filters.push(eq(profiles.role, roleFilter));
      if (statusFilter) filters.push(eq(profiles.status, statusFilter));
      if (searchTerm) {
        filters.push(
          or(
            ilike(peopleUsers.name, `%${searchTerm}%`),
            ilike(peopleUsers.email, `%${searchTerm}%`),
          )!,
        );
      }

      const [rows, [{ count: total }]] = await Promise.all([
        db
          .select({
            id: profiles.userId,
            name: peopleUsers.name,
            email: peopleUsers.email,
            phone: peopleUsers.phone,
            location: peopleUsers.location,
            image: peopleUsers.image,
            role: profiles.role,
            status: profiles.status,
            verified: profiles.verified,
            available: profiles.available,
            rating: profiles.rating,
            reviewCount: profiles.reviewCount,
            slug: profiles.slug,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .innerJoin(peopleUsers, eq(peopleUsers.id, profiles.userId))
          .where(filters.length ? and(...filters) : undefined)
          .orderBy(desc(profiles.createdAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: count() })
          .from(profiles)
          .innerJoin(peopleUsers, eq(peopleUsers.id, profiles.userId))
          .where(filters.length ? and(...filters) : undefined),
      ]);
      return NextResponse.json({
        people: rows.map((p) => ({
          id: p.id,
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          location: p.location || "",
          image: p.image || "",
          role: p.role || "customer",
          status: p.status || "draft",
          verified: p.verified || false,
          available: p.available ?? true,
          rating: p.rating || "0",
          reviewCount: p.reviewCount || 0,
          slug: p.slug || "",
          createdAt: p.createdAt?.toISOString() || "",
        })),
        total,
        page,
        pageSize,
      });
    }

    if (action === "bookings") {
      const artistUsers = alias(users, "artist_users");
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
          artistName: artistUsers.name,
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.userId, users.id))
        .leftJoin(profiles, eq(bookings.artistId, profiles.userId))
        .leftJoin(artistUsers, eq(profiles.userId, artistUsers.id))
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
        db.select({ id: profiles.userId, name: users.name, createdAt: profiles.createdAt, verified: profiles.verified })
          .from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(eq(profiles.role, "artist")).orderBy(profiles.createdAt).limit(5),
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
      const pendingUsers = alias(users, "pending_users");
      const [rows, [{ count: total }]] = await Promise.all([
        db
          .select({
            id: profiles.userId,
            name: pendingUsers.name,
            slug: profiles.slug,
            email: pendingUsers.email,
            phone: pendingUsers.phone,
            location: pendingUsers.location,
            image: pendingUsers.image,
            bio: profiles.bio,
            rating: profiles.rating,
            price: profiles.price,
            specialties: profiles.specialties,
            languages: profiles.languages,
            experience: profiles.experience,
            verified: profiles.verified,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .innerJoin(pendingUsers, eq(pendingUsers.id, profiles.userId))
          .where(eq(profiles.status, "pending_verification"))
          .orderBy(desc(profiles.createdAt))
          .limit(pageSize).offset(offset),
        db.select({ count: count() }).from(profiles).where(eq(profiles.status, "pending_verification")),
      ]);
      return NextResponse.json({
        artists: rows.map((a) => ({
          id: a.id,
          name: a.name || "",
          slug: a.slug || "",
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

      // Flag payments that are still "pending"/"held" but have a Billplz bill
      // we can re-check, so the dashboard can surface "paid but webhook
      // missed" cases. Reuse the shared helper (dryRun) so the Billplz
      // query path stays in one place.
      const pendingOrHeld = allPayments.filter(
        (p) => p.billplzId && (p.status === "pending" || p.status === "held"),
      );

      const reconcile: { paymentId: number; billplzId: string | null; billplzPaid: boolean | null; localStatus: string | null }[] = [];
      for (const p of pendingOrHeld) {
        const r = await reconcilePayment(p.id, { dryRun: true });
        reconcile.push({
          paymentId: r.paymentId,
          billplzId: r.billplzId,
          billplzPaid: r.billplzPaid,
          localStatus: r.localStatus,
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
    if (!session || !hasAdminAccess(session)) {
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
      const userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        name,
        email: email || `${artistSlug}@leish.local`,
        phone: phone || null,
        location: location || null,
        image: image || null,
        role: "artist",
        emailVerified: verified ?? true,
      });
      const [artist] = await db
        .insert(profiles)
        .values({
          userId,
          role: "artist",
          slug: artistSlug,
          bio: bio || null,
          price: price ? String(price) : "0",
          verified: verified ?? true,
          available: true,
          status: "verified",
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
        .update(profiles)
        .set({ status: "verified", verified: true, rejectionReason: null })
        .where(eq(profiles.userId, String(artistId)));
      return NextResponse.json({ success: true });
    }

    if (action === "reject-artist") {
      const { artistId, reason } = body;
      if (!artistId) {
        return NextResponse.json({ error: "artistId required" }, { status: 400 });
      }
      await db
        .update(profiles)
        .set({ status: "rejected", verified: false, rejectionReason: reason || null })
        .where(eq(profiles.userId, String(artistId)));
      return NextResponse.json({ success: true });
    }

    if (action === "toggle-verify") {
      const { artistId, verified } = body;
      if (artistId) {
        await db
          .update(profiles)
          .set({ verified })
          .where(eq(profiles.userId, String(artistId)));
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
          .delete(profiles)
          .where(eq(profiles.userId, String(artistId)));
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
      const result = await reconcilePayment(Number(paymentId));
      if (result.billplzId === null && !result.updated) {
        return NextResponse.json({ error: "Payment not found or has no Billplz bill" }, { status: 404 });
      }
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
