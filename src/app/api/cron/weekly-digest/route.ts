import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, bookings, reviews, loyaltyPoints } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { verifyCronSecret } from "@/lib/cron-auth";
import { sendEmail, hasBrevoKey } from "@/lib/email/brevo";
import { getDestination } from "@/lib/email/aliases";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasBrevoKey()) {
    return NextResponse.json({ error: "Brevo not configured" }, { status: 503 });
  }

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const providers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          sql`${users.role} IN ('artist', 'studio')`,
          sql`${users.email} IS NOT NULL`,
        ),
      );

    let sent = 0;

    for (const provider of providers) {
      const [bookingStats] = await db
        .select({
          total: sql<number>`COUNT(*)::int`,
          confirmed: sql<number>`COUNT(*) filter (where ${bookings.status} = 'confirmed')::int`,
          completed: sql<number>`COUNT(*) filter (where ${bookings.status} = 'completed')::int`,
          pending: sql<number>`COUNT(*) filter (where ${bookings.status} = 'pending')::int`,
        })
        .from(bookings)
        .where(
          and(
            sql`(${bookings.artistId} = ${provider.id} OR ${bookings.studioId} = ${provider.id})`,
            gte(bookings.createdAt, oneWeekAgo),
          ),
        );

      const [reviewStats] = await db
        .select({
          total: sql<number>`COUNT(*)::int`,
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)::float`,
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.artistId, provider.id),
            gte(reviews.createdAt, oneWeekAgo),
          ),
        );

      const [loyalty] = await db
        .select({ balance: loyaltyPoints.balance })
        .from(loyaltyPoints)
        .where(eq(loyaltyPoints.userId, provider.id))
        .limit(1);

      if (bookingStats.total === 0 && reviewStats.total === 0) continue;

      const subject = `Weekly Summary — ${bookingStats.total} booking${bookingStats.total !== 1 ? "s" : ""} this week`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0;">Leish! Weekly Summary</h1>
              <p style="color:#6b7280;font-size:14px;margin-top:4px;">Hi ${provider.name || "there"}, here's your week in review</p>
            </div>

            <div style="background:white;border-radius:16px;border:1px solid #e5e7eb;padding:24px;margin-bottom:16px;">
              <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 16px;">Bookings</h2>
              <div style="display:flex;gap:12px;">
                <div style="flex:1;text-align:center;padding:12px;background:#f0fdf4;border-radius:12px;">
                  <div style="font-size:24px;font-weight:700;color:#16a34a;">${bookingStats.confirmed}</div>
                  <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Confirmed</div>
                </div>
                <div style="flex:1;text-align:center;padding:12px;background:#eff6ff;border-radius:12px;">
                  <div style="font-size:24px;font-weight:700;color:#2563eb;">${bookingStats.completed}</div>
                  <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Completed</div>
                </div>
                <div style="flex:1;text-align:center;padding:12px;background:#fefce8;border-radius:12px;">
                  <div style="font-size:24px;font-weight:700;color:#ca8a04;">${bookingStats.pending}</div>
                  <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Pending</div>
                </div>
              </div>
            </div>

            ${reviewStats.total > 0 ? `
            <div style="background:white;border-radius:16px;border:1px solid #e5e7eb;padding:24px;margin-bottom:16px;">
              <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 12px;">Reviews</h2>
              <p style="color:#6b7280;font-size:14px;margin:0;">${reviewStats.total} new review${reviewStats.total !== 1 ? "s" : ""} &middot; ${reviewStats.avgRating.toFixed(1)} avg rating</p>
            </div>
            ` : ""}

            ${loyalty ? `
            <div style="background:white;border-radius:16px;border:1px solid #e5e7eb;padding:24px;margin-bottom:16px;">
              <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 12px;">Loyalty Points</h2>
              <p style="color:#6b7280;font-size:14px;margin:0;">${loyalty.balance} points available</p>
            </div>
            ` : ""}

            <div style="text-align:center;margin-top:32px;">
              <a href="https://leish.my/dashboard/${provider.role}" style="display:inline-block;padding:12px 24px;background:linear-gradient(to right,#f43f5e,#ec4899);color:white;font-weight:600;font-size:14px;border-radius:12px;text-decoration:none;">
                View Dashboard
              </a>
            </div>

            <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;">
              Leish! — Beauty Booking Marketplace
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail({
          to: provider.email,
          from: getDestination("notifications@leish.my"),
          fromName: "Leish!",
          subject,
          html,
          text: `Hi ${provider.name || "there"},\n\nBookings this week: ${bookingStats.total} (${bookingStats.confirmed} confirmed, ${bookingStats.completed} completed, ${bookingStats.pending} pending)\n${reviewStats.total > 0 ? `Reviews: ${reviewStats.total} new (${reviewStats.avgRating.toFixed(1)} avg)\n` : ""}${loyalty ? `Loyalty points: ${loyalty.balance}\n` : ""}\nView your dashboard: https://leish.my/dashboard/${provider.role}`,
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send digest to ${provider.email}:`, err);
      }
    }

    return NextResponse.json({ sent, total: providers.length });
  } catch (error) {
    console.error("Weekly digest error:", error);
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}
