import { hasAdminAccess } from "@/lib/auth/admin";
import { getAuthSession } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, profiles, bookings, payments } from "@/db/schema";
import { eq, count, and, or, gte, lt, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    const now = new Date();
    let periodDays: number;
    switch (period) {
      case "7d": periodDays = 7; break;
      case "90d": periodDays = 90; break;
      default: periodDays = 30; break;
    }

    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodEnd = new Date(now);

    const lastPeriodStart = new Date(periodStart);
    lastPeriodStart.setDate(lastPeriodStart.getDate() - periodDays);
    const lastPeriodEnd = new Date(periodStart);

    // Helper to get first day of month for the last 6 months
    function getMonthStarts(): Date[] {
      const months: Date[] = [];
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      for (let i = 0; i < 6; i++) {
        months.push(new Date(d));
        d.setMonth(d.getMonth() - 1);
      }
      return months.reverse();
    }
    const monthStarts = getMonthStarts();

    const paidOrReleased = or(eq(payments.status, "paid"), eq(payments.status, "released"));

    const [
      gmvResult,
      gmvThisPeriodResult,
      gmvLastPeriodResult,
      activeUsersThisPeriodResult,
      activeUsersLastPeriodResult,
      totalUsersResult,
      newUsersThisPeriodResult,
      totalBookingsResult,
      bookingsInPeriodResult,
      bookingsInLastPeriodResult,
      avgOrderResult,
      bookingsByStatusResult,
    ] = await Promise.all([
      // GMV: total paid/released payments
      db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
      }).from(payments).where(paidOrReleased),

      // GMV this period
      db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
      }).from(payments).where(
        and(paidOrReleased, gte(payments.createdAt, periodStart), lt(payments.createdAt, periodEnd))
      ),

      // GMV last period
      db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
      }).from(payments).where(
        and(paidOrReleased, gte(payments.createdAt, lastPeriodStart), lt(payments.createdAt, lastPeriodEnd))
      ),

      // Active users this period (distinct users who made bookings)
      db.select({
        count: sql<number>`COUNT(DISTINCT ${bookings.userId})`,
      }).from(bookings).where(
        and(gte(bookings.createdAt, periodStart), lt(bookings.createdAt, periodEnd))
      ),

      // Active users last period
      db.select({
        count: sql<number>`COUNT(DISTINCT ${bookings.userId})`,
      }).from(bookings).where(
        and(gte(bookings.createdAt, lastPeriodStart), lt(bookings.createdAt, lastPeriodEnd))
      ),

      // Total users
      db.select({ count: count() }).from(users),

      // New users this period
      db.select({ count: count() }).from(users).where(
        and(gte(users.createdAt, periodStart), lt(users.createdAt, periodEnd))
      ),

      // Total bookings
      db.select({ count: count() }).from(bookings),

      // Bookings this period
      db.select({ count: count() }).from(bookings).where(
        and(gte(bookings.createdAt, periodStart), lt(bookings.createdAt, periodEnd))
      ),

      // Bookings last period
      db.select({ count: count() }).from(bookings).where(
        and(gte(bookings.createdAt, lastPeriodStart), lt(bookings.createdAt, lastPeriodEnd))
      ),

      // Average order value (paid bookings)
      db.select({
        avg: sql<number>`COALESCE(AVG(CAST(${bookings.amount} AS NUMERIC)), 0)`,
      }).from(bookings).where(
        or(eq(bookings.status, "confirmed"), eq(bookings.status, "completed"), eq(bookings.status, "paid"))
      ),

      // Bookings by status
      db.select({
        status: bookings.status,
        count: count(),
      }).from(bookings).groupBy(bookings.status),
    ]);

    const gmvTotal = Number(gmvResult[0]?.total || 0) / 100;
    const gmvThisPeriod = Number(gmvThisPeriodResult[0]?.total || 0) / 100;
    const gmvLastPeriod = Number(gmvLastPeriodResult[0]?.total || 0) / 100;

    const activeUsersThisPeriod = Number(activeUsersThisPeriodResult[0]?.count || 0);
    const activeUsersLastPeriod = Number(activeUsersLastPeriodResult[0]?.count || 0);
    const totalUsers = totalUsersResult[0]?.count || 0;
    const newUsersThisPeriod = newUsersThisPeriodResult[0]?.count || 0;

    const bookingsInPeriod = bookingsInPeriodResult[0]?.count || 0;
    const bookingsInLastPeriod = bookingsInLastPeriodResult[0]?.count || 0;

    const conversionRate = activeUsersThisPeriod > 0
      ? Number(((bookingsInPeriod / activeUsersThisPeriod) * 100).toFixed(1))
      : 0;
    const conversionRateLastPeriod = activeUsersLastPeriod > 0
      ? Number(((bookingsInLastPeriod / activeUsersLastPeriod) * 100).toFixed(1))
      : 0;

    const avgOrderValue = Number(Number(avgOrderResult[0]?.avg || 0).toFixed(2));

    const bookingsByStatus = bookingsByStatusResult.map((r) => ({
      status: r.status || "unknown",
      count: r.count,
    }));

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number }[] = [];
    for (let i = 0; i < monthStarts.length; i++) {
      const mStart = monthStarts[i];
      const mEnd = new Date(mStart);
      mEnd.setMonth(mEnd.getMonth() + 1);

      const [result] = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
      }).from(payments).where(
        and(paidOrReleased, gte(payments.createdAt, mStart), lt(payments.createdAt, mEnd))
      );

      const monthStr = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth.push({ month: monthStr, revenue: Number(Number(result?.total || 0) / 100) });
    }

    // Top 5 artists by booking count
    const topArtistsResult = await db
      .select({
        artistId: bookings.artistId,
        name: users.name,
        bookingCount: count(),
      })
      .from(bookings)
      .innerJoin(profiles, eq(bookings.artistId, profiles.userId))
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.role, "artist"))
      .groupBy(bookings.artistId, users.name)
      .orderBy(desc(count()))
      .limit(5);

    const topArtists = topArtistsResult.map((a) => ({
      artistId: a.artistId,
      name: a.name || "Unknown",
      bookingCount: a.bookingCount,
    }));

    // User growth (last 6 months)
    const userGrowth: { month: string; users: number }[] = [];
    for (let i = 0; i < monthStarts.length; i++) {
      const mStart = monthStarts[i];
      const mEnd = new Date(mStart);
      mEnd.setMonth(mEnd.getMonth() + 1);

      const [result] = await db.select({
        count: count(),
      }).from(users).where(
        and(gte(users.createdAt, mStart), lt(users.createdAt, mEnd))
      );

      const monthStr = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`;
      userGrowth.push({ month: monthStr, users: result?.count || 0 });
    }

    return NextResponse.json({
      gmv: gmvTotal,
      gmvThisPeriod,
      gmvLastPeriod,
      activeUsers: activeUsersThisPeriod,
      activeUsersLastPeriod,
      totalUsers,
      newUsersThisPeriod,
      conversionRate,
      conversionRateLastPeriod,
      avgOrderValue,
      bookingsByStatus,
      revenueByMonth,
      topArtists,
      userGrowth,
    });
  } catch (error) {
    console.error("Admin analytics GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
