import "dotenv/config";
import { db } from "../src/db";
import { bookings, payments } from "../src/db/schema";
import { eq, and, isNull, notExists, sql } from "drizzle-orm";

async function backfillPaymentRecords() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = args.includes("--dry-run") || !isApply;

  if (isDryRun && !isApply) {
    console.log("[backfill] DRY RUN — no payment records will be created.");
    console.log("[backfill] Pass --apply to perform the actual backfill.\n");
  } else {
    console.log("[backfill] APPLY MODE — payment records WILL be created.\n");
  }

  const confirmedBookings = await db
    .select({
      id: bookings.id,
      amount: bookings.amount,
      userId: bookings.userId,
      artistId: bookings.artistId,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        notExists(
          db
            .select({ id: payments.id })
            .from(payments)
            .where(eq(payments.bookingId, bookings.id)),
        ),
      ),
    )
    .orderBy(bookings.id);

  console.log(`Found ${confirmedBookings.length} confirmed bookings without payment records.\n`);

  if (confirmedBookings.length === 0) {
    console.log("[backfill] Nothing to backfill.");
    return;
  }

  let created = 0;
  let errors = 0;

  for (const booking of confirmedBookings) {
    const amountCents = Math.round(Number(booking.amount) * 100);

    if (isDryRun) {
      console.log(
        `[dry-run] Would create payment for booking #${booking.id}: ` +
          `amount=${amountCents} cents (MYR ${booking.amount}), method=manual`,
      );
      created++;
      continue;
    }

    try {
      const [payment] = await db
        .insert(payments)
        .values({
          bookingId: booking.id,
          amount: amountCents,
          status: "paid",
          method: "manual",
          paidAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      created++;
      console.log(
        `  Created payment #${payment.id} for booking #${booking.id}: ` +
          `MYR ${booking.amount} (method=manual)`,
      );
    } catch (err) {
      errors++;
      console.error(`  ERROR for booking #${booking.id}:`, err);
    }
  }

  console.log(`\nDone. created=${created}, errors=${errors}`);

  if (isDryRun && !isApply) {
    console.log("\n[backfill] Re-run with --apply to commit.");
  }
}

backfillPaymentRecords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[backfill] Fatal:", err);
    process.exit(1);
  });