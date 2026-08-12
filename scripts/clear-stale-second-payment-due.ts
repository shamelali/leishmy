import "dotenv/config";
import { db } from "../src/db";
import { bookings, payments } from "../src/db/schema";
import { and, eq, isNull, inArray, exists, sql } from "drizzle-orm";

/**
 * Clear stale secondPaymentDueDate on bookings that were confirmed during the
 * window where kind "full" was treated as deposit-like (commit c93db35 through
 * 231e022) and still carry a stamped due date that send-second-payments would
 * bill against a balance the customer already paid in full.
 *
 * Criteria (mirrors how a full upfront payment is now classified):
 *   - status pending/confirmed
 *   - secondPaymentDueDate set, remainingPaymentSent null
 *   - no deposit configured (0/unset) → a paid payment for the FULL booking
 *     amount means the whole balance was collected upfront
 *
 * DRY RUN by default. Pass --apply to commit.
 */
async function clearStaleSecondPaymentDue() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = args.includes("--dry-run") || !isApply;

  const candidates = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      amount: bookings.amount,
      depositAmount: bookings.depositAmount,
      secondPaymentDueDate: bookings.secondPaymentDueDate,
    })
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, ["pending", "confirmed"]),
        sql`${bookings.secondPaymentDueDate} IS NOT NULL`,
        isNull(bookings.remainingPaymentSent),
        sql`COALESCE(${bookings.depositAmount}, 0) = 0`,
        exists(
          db
            .select({ id: payments.id })
            .from(payments)
            .where(
              and(
                eq(payments.bookingId, bookings.id),
                eq(payments.status, "paid"),
                sql`${payments.amount} = ROUND(${bookings.amount} * 100)`,
              ),
            ),
        ),
      ),
    )
    .orderBy(bookings.id);

  console.log(`Found ${candidates.length} full-upfront bookings with a stale secondPaymentDueDate.\n`);

  if (candidates.length === 0) {
    console.log("[backfill] Nothing to remediate.");
    return;
  }

  if (isDryRun && !isApply) {
    console.log("[backfill] DRY RUN — no updates will be applied. Pass --apply to commit.\n");
  } else {
    console.log("[backfill] APPLY MODE — clearing secondPaymentDueDate.\n");
  }

  let updated = 0;
  let errors = 0;

  for (const booking of candidates) {
    if (isDryRun) {
      console.log(
        `[dry-run] Would clear secondPaymentDueDate for booking #${booking.id}: ` +
          `amount=MYR ${booking.amount}, deposit=${booking.depositAmount ?? "unset"}, due=${booking.secondPaymentDueDate?.toISOString()}`,
      );
      updated++;
      continue;
    }

    try {
      await db
        .update(bookings)
        .set({ secondPaymentDueDate: null, updatedAt: new Date() })
        .where(eq(bookings.id, booking.id));
      updated++;
      console.log(`  Cleared secondPaymentDueDate for booking #${booking.id}`);
    } catch (err) {
      errors++;
      console.error(`  ERROR for booking #${booking.id}:`, err);
    }
  }

  console.log(`\nDone. updated=${updated}, errors=${errors}`);

  if (isDryRun && !isApply) {
    console.log("\n[backfill] Re-run with --apply to commit.");
  }
}

clearStaleSecondPaymentDue()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[backfill] Fatal:", err);
    process.exit(1);
  });