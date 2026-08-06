import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, bookings, payments, reviews, users, services } from "@/db/schema";
import { eq, and, count, sum, avg, gte, sql, desc } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const studioId = searchParams.get("studioId");

    if (!artistId && !studioId) {
      return NextResponse.json({ error: "artistId or studioId required" }, { status: 400 });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = artistId || studioId!;
    const isStudio = !!studioId;

    if (!hasAdminAccess(session)) {
      const role = isStudio ? "studio" : "artist";
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, id), eq(profiles.role, role)))
        .limit(1);
      if (!profile || profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const idCondition = isStudio ? eq(bookings.studioId, id) : eq(bookings.artistId, id);

    const [bookingCount, lastMonthBookingCount] = await Promise.all([
      db.select({ count: count() }).from(bookings).where(idCondition),
      db.select({ count: count() }).from(bookings).where(and(idCondition, gte(bookings.createdAt, startOfLastMonth), sql`${bookings.createdAt} < ${startOfMonth}`)),
    ]);

    const totalBookings = bookingCount[0]?.count || 0;
    const lastMonthBookings = lastMonthBookingCount[0]?.count || 0;

    const recentBookings = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(idCondition, gte(bookings.createdAt, startOfMonth)));
    const thisMonthBookings = recentBookings[0]?.count || 0;

    const bookingChange = lastMonthBookings > 0
      ? `+${Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)}%`
      : thisMonthBookings > 0 ? "+100%" : "0%";

    const paymentData = await db
      .select({ total: sum(payments.amount), count: count() })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(and(idCondition, sql`${payments.status} IN ('paid', 'released')`));

    const revenue = Number(paymentData[0]?.total || 0);
    const paidCount = paymentData[0]?.count || 0;

    const lastMonthPayments = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(and(idCondition, gte(payments.createdAt, startOfLastMonth), sql`${payments.createdAt} < ${startOfMonth}`, sql`${payments.status} IN ('paid', 'released')`));

    const lastMonthRevenue = Number(lastMonthPayments[0]?.total || 0);
    const revenueChange = lastMonthRevenue > 0
      ? `+${Math.round(((revenue - lastMonthRevenue) / lastMonthRevenue) * 100)}%`
      : revenue > 0 ? "+100%" : "0%";

    const clientData = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(idCondition, gte(bookings.createdAt, startOfMonth)));
    const thisMonthClients = clientData[0]?.count || 0;

    const lastMonthClientsData = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(idCondition, gte(bookings.createdAt, startOfLastMonth), sql`${bookings.createdAt} < ${startOfMonth}`));
    const lastMonthClients = lastMonthClientsData[0]?.count || 0;

    const clientChange = lastMonthClients > 0
      ? `+${Math.round(((thisMonthClients - lastMonthClients) / lastMonthClients) * 100)}%`
      : thisMonthClients > 0 ? "+100%" : "0%";

    const ratingCondition = isStudio ? eq(reviews.studioId, id) : eq(reviews.artistId, id);
    const ratingData = await db
      .select({ avg: avg(sql`CAST(${reviews.rating} AS DECIMAL)`) })
      .from(reviews)
      .where(ratingCondition);
    const avgRating = ratingData[0]?.avg ? Number(Number(ratingData[0].avg).toFixed(1)) : 0;

    const monthlyData = await db
      .select({ month: sql`EXTRACT(MONTH FROM ${bookings.createdAt})`.as("month"), count: count() })
      .from(bookings)
      .where(and(idCondition, sql`EXTRACT(YEAR FROM ${bookings.createdAt}) = ${now.getFullYear()}`))
      .groupBy(sql`EXTRACT(MONTH FROM ${bookings.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${bookings.createdAt})`);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyBookings = monthNames.map((name, i) => {
      const found = monthlyData.find((d) => Number(d.month) === i + 1);
      return { month: name, count: found ? Number(found.count) : 0 };
    });

    // Studio-specific: artist breakdown and service breakdown
    let artistBreakdown: { name: string; bookings: number; revenue: number }[] = [];
    let serviceBreakdown: { name: string; count: number; revenue: number }[] = [];

    if (isStudio) {
      // Get staff members linked to this studio
      const staffRows = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.studioId, id), eq(profiles.role, "artist")));

      const staffIds = staffRows.map((s) => s.userId);

      if (staffIds.length > 0) {
        // Bookings per artist
        const artistBookings = await db
          .select({
            artistId: bookings.artistId,
            count: count(),
          })
          .from(bookings)
          .where(and(eq(bookings.studioId, id), sql`${bookings.artistId} IN (${sql.join(staffIds.map((id) => sql`${id}`), sql`, `)})`))
          .groupBy(bookings.artistId);

        // Revenue per artist
        const artistRevenue = await db
          .select({
            artistId: bookings.artistId,
            total: sum(payments.amount),
          })
          .from(payments)
          .innerJoin(bookings, eq(payments.bookingId, bookings.id))
          .where(and(eq(bookings.studioId, id), sql`${payments.status} IN ('paid', 'released')`, sql`${bookings.artistId} IN (${sql.join(staffIds.map((id) => sql`${id}`), sql`, `)})`))
          .groupBy(bookings.artistId);

        // Get names
        const artistNames = await db
          .select({ userId: users.id, name: users.name })
          .from(users)
          .where(sql`${users.id} IN (${sql.join(staffIds.map((id) => sql`${id}`), sql`, `)})`);

        const nameMap = new Map(artistNames.map((a) => [a.userId, a.name || "Artist"]));
        const bookingMap = new Map(artistBookings.map((a) => [a.artistId, Number(a.count)]));
        const revenueMap = new Map(artistRevenue.map((a) => [a.artistId, Number(a.total || 0)]));

        artistBreakdown = staffIds.map((sid) => ({
          name: nameMap.get(sid) || "Artist",
          bookings: bookingMap.get(sid) || 0,
          revenue: revenueMap.get(sid) || 0,
        }));
      }

      // Service breakdown for studio bookings
      const serviceRows = await db
        .select({
          service: bookings.service,
          count: count(),
          total: sum(payments.amount),
        })
        .from(bookings)
        .leftJoin(payments, eq(payments.bookingId, bookings.id))
        .where(and(eq(bookings.studioId, id), sql`${payments.status} IN ('paid', 'released')`))
        .groupBy(bookings.service)
        .orderBy(desc(sql`count(*)`));

      serviceBreakdown = serviceRows.map((s) => ({
        name: s.service || "Unknown",
        count: Number(s.count),
        revenue: Number(s.total || 0),
      }));
    }

    return NextResponse.json({
      totalBookings,
      thisMonthBookings,
      bookingChange,
      revenue,
      revenueChange,
      thisMonthClients,
      clientChange,
      avgRating,
      paidCount,
      monthlyBookings,
      artistBreakdown,
      serviceBreakdown,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
