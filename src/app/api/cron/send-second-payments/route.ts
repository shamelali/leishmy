import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, users, profiles, notifications } from "@/db/schema";
import { eq, and, gte, lte, inArray, isNull, like, or } from "drizzle-orm";
import { sendMessage } from "@/lib/notifications/whatsapp";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";
import { createBillForBooking } from "@/lib/billplz-bill";
import { sendRemainingPaymentReminderEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://leish.my";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const sevenDaysFromNow = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    const eightDaysFromNow = new Date(
      today.getTime() + 8 * 24 * 60 * 60 * 1000,
    );

    // Find bookings where second payment is due in 7-8 days
    // milestone is set dynamically as deposit_{percent} (e.g. deposit_30, deposit_50)
    const dueBookings = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        artistId: bookings.artistId,
        amount: bookings.amount,
        depositAmount: bookings.depositAmount,
        date: bookings.date,
        time: bookings.time,
        service: bookings.service,
        milestone: bookings.milestone,
        status: bookings.status,
        secondPaymentDueDate: bookings.secondPaymentDueDate,
      })
      .from(bookings)
      .where(
        and(
          or(
            like(bookings.milestone, "deposit_%"),
            isNull(bookings.milestone),
          ),
          gte(bookings.secondPaymentDueDate, sevenDaysFromNow),
          lte(bookings.secondPaymentDueDate, eightDaysFromNow),
          inArray(bookings.status, ["pending", "confirmed"]),
          isNull(bookings.remainingPaymentSent),
        ),
      )
      .limit(100);

    const allIds = [
      ...new Set([
        ...dueBookings.map((b) => b.userId).filter(Boolean),
        ...dueBookings.map((b) => b.artistId).filter(Boolean),
      ]),
    ] as string[];
    const userMap = new Map<
      string,
      { name: string | null; email: string | null; phone: string | null }
    >();

    if (allIds.length > 0) {
      const usersResult = await db
        .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
        .from(users)
        .where(inArray(users.id, allIds));

      for (const user of usersResult) {
        userMap.set(user.id, {
          name: user.name,
          email: user.email,
          phone: user.phone,
        });
      }
    }

    let sentCount = 0;

    for (const booking of dueBookings) {
      const user = booking.userId ? userMap.get(booking.userId) : null;
      if (!user) continue;

      const remainingAmount =
        Number(booking.amount) - (Number(booking.depositAmount) || 0);
      if (remainingAmount <= 0) continue;

      // Create a Billplz bill for the second payment
      const idempotencyKey = `second-payment-${booking.id}`;
      const billResult = await createBillForBooking({
        bookingId: booking.id,
        description: `Remaining payment for booking #${booking.id}`,
        name: user.name || "Customer",
        email: user.email || "",
        phone: user.phone || "",
        idempotencyKey,
        redirectUrl: `${BASE_URL}/bookings/${booking.id}/success?type=remaining`,
      });

      let paymentUrl = `${BASE_URL}/bookings/${booking.id}`;

      if (billResult.ok) {
        const billId = billResult.data.bill.id;
        if (billId) {
          // Build the Billplz payment URL
          const billplzApiUrl = process.env.BILLPLZ_API_URL || "https://www.billplz.com/api/v3";
          const billplzBaseUrl = billplzApiUrl.replace("/api/v3", "");
          paymentUrl = `${billplzBaseUrl}/v4/bills/${billId}`;
        }
      } else {
        console.warn(
          `[cron/send-second-payments] failed to create bill for booking ${booking.id}:`,
          billResult.error,
        );
      }

      const dueDateStr = booking.secondPaymentDueDate
        ? new Date(booking.secondPaymentDueDate).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "soon";

      const message =
        "Hi " +
        (user.name || "Customer") +
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
        " is due by " +
        dueDateStr +
        ". Please complete the payment to confirm your appointment." +
        "\n\nPay now: " +
        paymentUrl +
        "\n\nThank you,\nLeish";

      // Send WhatsApp reminder
      await sendMessage(user.name || "Customer", message).catch(() => {});

      // Send email with payment link
      if (user.email) {
        const bookingDate = booking.date
          ? new Date(booking.date).toLocaleDateString("en-MY", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "TBD";

        await sendRemainingPaymentReminderEmail({
          email: user.email,
          customerName: user.name || "Customer",
          bookingId: String(booking.id),
          serviceName: booking.service || "Beauty service",
          providerName: "",
          date: bookingDate,
          time: booking.time || "TBD",
          remainingAmount,
          dueDate: dueDateStr,
          paymentUrl,
        }).catch((err) =>
          console.error(
            `[cron/send-second-payments] email failed for booking ${booking.id}:`,
            err,
          ),
        );
      }

      // Notify provider that customer's remaining payment is due
      if (booking.artistId) {
        const provider = userMap.get(booking.artistId);
        if (provider) {
          const providerMessage =
            "Hi " +
            (provider.name || "Provider") +
            ", the remaining balance of MYR " +
            remainingAmount.toFixed(2) +
            " for booking #" +
            booking.id +
            " (" +
            booking.service +
            " on " +
            booking.date.toLocaleDateString("en-MY") +
            ") is due by " +
            dueDateStr +
            ".\n\nThe customer has been notified to complete payment." +
            "\n\nThank you,\nLeish";

          await sendMessage(provider.name || "Provider", providerMessage).catch(() => {});

          await db.insert(notifications).values({
            userId: booking.artistId,
            type: "second_payment_due",
            title: "Second Payment Due",
            body: `Remaining balance of MYR ${remainingAmount.toFixed(2)} for booking #${booking.id} is due by ${dueDateStr}. Customer has been notified.`,
            data: { link: `/bookings/${booking.id}`, bookingId: String(booking.id) },
          }).catch(() => {});
        }
      }

      await db
        .update(bookings)
        .set({ remainingPaymentSent: true })
        .where(eq(bookings.id, booking.id));

      sentCount++;
    }

    await recordCronRun(
      "send-second-payments",
      "success",
      `Sent ${sentCount} payment reminders`,
    );

    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
    });
  } catch (err: unknown) {
    console.error("[cron/send-second-payments] error:", err);
    await recordCronRun(
      "send-second-payments",
      "error",
      err instanceof Error ? err.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
