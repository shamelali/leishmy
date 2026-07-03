import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, payments, reviews } from "@/db/schema";
import { eq, and, count, sum, avg, gte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json({ error: "artistId required" }, { status: 400 });
    }

    const id = Number(artistId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [bookingCount, lastMonthBookingCount] = await Promise.all([
      db.select({ count: count() }).from(bookings).where(eq(bookings.artistId, id)),
      db.select({ count: count() }).from(bookings).where(and(eq(bookings.artistId, id), gte(bookings.createdAt, startOfLastMonth), sql`${bookings.createdAt} < ${startOfMonth}`)),
    ]);

    const totalBookings = bookingCount[0]?.count || 0;
    const lastMonthBookings = lastMonthBookingCount[0]?.count || 0;

    const recentBookings = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.artistId, id), gte(bookings.createdAt, startOfMonth)));
    const thisMonthBookings = recentBookings[0]?.count || 0;

    const bookingChange = lastMonthBookings > 0
      ? `+${Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)}%`
      : thisMonthBookings > 0 ? "+100%" : "0%";

    const paymentData = await db
      .select({ total: sum(payments.amount), count: count() })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(and(eq(bookings.artistId, id), sql`${payments.status} IN ('paid', 'released')`));

    const revenue = Number(paymentData[0]?.total || 0);
    const paidCount = paymentData[0]?.count || 0;

    const lastMonthPayments = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(and(eq(bookings.artistId, id), gte(payments.createdAt, startOfLastMonth), sql`${payments.createdAt} < ${startOfMonth}`, sql`${payments.status} IN ('paid', 'released')`));

    const lastMonthRevenue = Number(lastMonthPayments[0]?.total || 0);
    const revenueChange = lastMonthRevenue > 0
      ? `+${Math.round(((revenue - lastMonthRevenue) / lastMonthRevenue) * 100)}%`
      : revenue > 0 ? "+100%" : "0%";

    const clientData = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.artistId, id), gte(bookings.createdAt, startOfMonth)));
    const thisMonthClients = clientData[0]?.count || 0;

    const lastMonthClientsData = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.artistId, id), gte(bookings.createdAt, startOfLastMonth), sql`${bookings.createdAt} < ${startOfMonth}`));
    const lastMonthClients = lastMonthClientsData[0]?.count || 0;

    const clientChange = lastMonthClients > 0
      ? `+${Math.round(((thisMonthClients - lastMonthClients) / lastMonthClients) * 100)}%`
      : thisMonthClients > 0 ? "+100%" : "0%";

    const ratingData = await db
      .select({ avg: avg(sql`CAST(${reviews.rating} AS DECIMAL)`) })
      .from(reviews)
      .where(eq(reviews.artistId, id));
    const avgRating = ratingData[0]?.avg ? Number(Number(ratingData[0].avg).toFixed(1)) : 0;

    const monthlyData = await db
      .select({ month: sql`EXTRACT(MONTH FROM ${bookings.createdAt})`.as("month"), count: count() })
      .from(bookings)
      .where(and(eq(bookings.artistId, id), sql`EXTRACT(YEAR FROM ${bookings.createdAt}) = ${now.getFullYear()}`))
      .groupBy(sql`EXTRACT(MONTH FROM ${bookings.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${bookings.createdAt})`);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyBookings = monthNames.map((name, i) => {
      const found = monthlyData.find((d) => Number(d.month) === i + 1);
      return { month: name, count: found ? Number(found.count) : 0 };
    });

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
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
