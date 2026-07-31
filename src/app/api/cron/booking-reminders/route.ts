import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { sendMessage } from "@/lib/notifications/whatsapp";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
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

    const userIds = [...new Set(upcomingBookings.map((b) => b.userId).filter(Boolean))] as string[];
    const userMap = new Map<string, { name: string | null; phone: string | null; email: string | null }>();

    if (userIds.length > 0) {
      const usersResult = await db
        .select({ id: users.id, name: users.name, phone: users.phone, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds));

      for (const user of usersResult) {
        userMap.set(user.id, { name: user.name, phone: user.phone, email: user.email });
      }
    }

    for (const booking of upcomingBookings) {
      const user = booking.userId ? userMap.get(booking.userId) : null;
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

    await recordCronRun("booking-reminders", "success", `Sent ${upcomingBookings.length} reminders`);

    return NextResponse.json({
      success: true,
      remindersSent: upcomingBookings.length,
    });
  } catch (err: unknown) {
    console.error("[cron/booking-reminders] error:", err);
    await recordCronRun("booking-reminders", "error", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}