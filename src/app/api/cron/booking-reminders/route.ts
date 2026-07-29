import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { sendMessage } from "@/lib/notifications/whatsapp";

const CRON_SECRET_HEADER = "x-cron-secret";

function isValidRequest(request: Request): boolean {
  const secret = request.headers.get(CRON_SECRET_HEADER);
  if (secret && secret === process.env.CRON_SECRET) return true;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  return !!querySecret && querySecret === process.env.CRON_SECRET;
}

export async function POST(request: Request) {
  if (!isValidRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingBookings = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        artistId: bookings.artistId,
        date: bookings.date,
        time: bookings.time,
        service: bookings.service,
        amount: bookings.amount,
        milestone: bookings.milestone,
        secondPaymentDueDate: bookings.secondPaymentDueDate,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.date, oneDayFromNow),
          lte(bookings.date, new Date(oneDayFromNow.getTime() + 60 * 60 * 1000)),
          inArray(bookings.status, ["pending", "confirmed"]),
        ),
      )
      .limit(100);

    for (const booking of upcomingBookings) {
      const [user] = await db
        .select({ name: users.name, phone: users.phone, email: users.email })
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      if (!user) continue;

      if (user.phone) {
        const reminderText =
          "Hi " +
          user.name +
          ", this is a reminder about your booking scheduled for " +
          booking.date.toLocaleDateString("en-MY") +
          " at " +
          booking.time +
          ". Service: " +
          booking.service +
          ".\n\nThank you,\nLeish";
        await sendMessage(user.phone, reminderText)        .catch((err: unknown) =>
          console.error("Reminder WhatsApp failed for booking", booking.id, err)
        );
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: upcomingBookings.length,
    });
  } catch (err: unknown) {
    console.error("[cron/booking-reminders] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}