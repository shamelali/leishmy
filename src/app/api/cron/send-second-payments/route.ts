import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { eq, and, gte, lte, inArray, isNull } from "drizzle-orm";
import { sendMessage } from "@/lib/notifications/whatsapp";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    const eightDaysFromNow = new Date(
      today.getTime() + 8 * 24 * 60 * 60 * 1000
    );

    const bridalBookings = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        amount: bookings.amount,
        depositAmount: bookings.depositAmount,
        date: bookings.date,
        time: bookings.time,
        service: bookings.service,
        milestone: bookings.milestone,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          inArray(bookings.milestone, ["deposit_50"]),
          gte(bookings.secondPaymentDueDate, sevenDaysFromNow),
          lte(bookings.secondPaymentDueDate, eightDaysFromNow),
          inArray(bookings.status, ["pending", "confirmed"]),
          isNull(bookings.remainingPaymentSent),
        ),
      )
      .limit(100);

    const userIds = [...new Set(bridalBookings.map((b) => b.userId).filter(Boolean))] as string[];
    const userMap = new Map<string, { name: string | null; email: string | null }>();

    if (userIds.length > 0) {
      const usersResult = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds));

      for (const user of usersResult) {
        userMap.set(user.id, { name: user.name, email: user.email });
      }
    }

    for (const booking of bridalBookings) {
      const user = booking.userId ? userMap.get(booking.userId) : null;
      if (!user) continue;

      const remainingAmount =
        Number(booking.amount) - (Number(booking.depositAmount) || 0);

      const message =
        "Hi " +
        user.name +
        ", your booking #" +
        booking.id +
        " for " +
        booking.service +
        " on " +
        booking.date.toLocaleDateString("en-MY") +
        " at " +
        booking.time +
        " is coming up." +
        "\n\nThe remaining balance of MYR " +
        remainingAmount.toFixed(2) +
        " is due. Please complete the payment to confirm your appointment." +
        "\n\nThank you,\nLeish";

      await sendMessage(user.name || "Customer", message).catch(() => {});

      await db
        .update(bookings)
        .set({ remainingPaymentSent: true })
        .where(eq(bookings.id, booking.id));
    }

    await recordCronRun("send-second-payments", "success", `Sent ${bridalBookings.length} payment reminders`);

    return NextResponse.json({
      success: true,
      remindersSent: bridalBookings.length,
    });
  } catch (err: unknown) {
    console.error("[cron/send-second-payments] error:", err);
    await recordCronRun("send-second-payments", "error", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}