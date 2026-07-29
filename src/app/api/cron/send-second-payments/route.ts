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
        ),
      )
      .limit(100);

    for (const booking of bridalBookings) {
      const [user] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

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
    }

    return NextResponse.json({
      success: true,
      remindersSent: bridalBookings.length,
    });
  } catch (err: unknown) {
    console.error("[cron/send-second-payments] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}