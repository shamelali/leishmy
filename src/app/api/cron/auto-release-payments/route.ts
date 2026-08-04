import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, payouts, bookings, notifications, adminSettings } from "@/db/schema";
import { awardPoints } from "@/lib/loyalty";
import { eq, sql, and, lte } from "drizzle-orm";
import { Redis } from "@upstash/redis";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOCK_KEY = "leish:auto-release:lock";
const LOCK_TTL_SECONDS = 10 * 60;
const COOLING_DAYS = 3;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

async function acquireLock(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;
  const acquired = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL_SECONDS });
  return acquired === "OK";
}

async function releaseLock() {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(LOCK_KEY);
}

export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await acquireLock())) {
    return NextResponse.json(
      { error: "Auto-release already running" },
      { status: 409 },
    );
  }

  try {
    let dryRun = false;
    try {
      const body = (await request.json()) as { dryRun?: boolean };
      dryRun = body.dryRun === true;
    } catch {
      // empty body is fine
    }

    const cutoff = sql`NOW() - INTERVAL '${sql.raw(String(COOLING_DAYS))} days'`;

    const rows = await db
      .select({
        paymentId: payments.id,
        paymentAmount: payments.amount,
        paymentStatus: payments.status,
        billplzId: payments.billplzId,
        bookingId: bookings.id,
        bookingDate: bookings.date,
        userId: bookings.userId,
        artistId: bookings.artistId,
        studioId: bookings.studioId,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          eq(payments.status, "paid"),
          lte(bookings.date, cutoff),
        ),
      )
      .orderBy(payments.id);

    const details: {
      paymentId: number;
      bookingId: number | null;
      recipientId: string | null;
      amount: number;
      commissionRate: number;
      commissionAmount: number;
      netAmount: number;
      released: boolean;
      reason: string;
    }[] = [];

    let released = 0;
    let skipped = 0;
    let errors = 0;

    // Fetch current commission rate from admin_settings (default 8%)
    const [commissionSetting] = await db
      .select({ value: adminSettings.value })
      .from(adminSettings)
      .where(eq(adminSettings.key, "commission_rate"))
      .limit(1);
    const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.08;

    for (const row of rows) {
      const recipientId = row.artistId || row.studioId;

      if (!recipientId) {
        skipped += 1;
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId: null,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: 0,
          netAmount: 0,
          released: false,
          reason: "no artistId or studioId on booking",
        });
        continue;
      }

      if (dryRun) {
        const commissionAmt = Math.round(row.paymentAmount * commissionRate);
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: commissionAmt,
          netAmount: row.paymentAmount - commissionAmt,
          released: false,
          reason: "dry run",
        });
        continue;
      }

      try {
        const commissionAmt = Math.round(row.paymentAmount * commissionRate);
        const netAmount = row.paymentAmount - commissionAmt;

        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({ status: "released", updatedAt: new Date() })
            .where(eq(payments.id, row.paymentId));

          if (row.bookingId) {
            await tx
              .update(bookings)
              .set({ status: "completed", updatedAt: new Date() })
              .where(eq(bookings.id, row.bookingId));
          }

          const [existing] = await tx
            .select({ id: payouts.id })
            .from(payouts)
            .where(eq(payouts.paymentId, row.paymentId))
            .limit(1);

          if (!existing) {
            await tx.insert(payouts).values({
              userId: recipientId,
              amount: row.paymentAmount,
              commissionRate: String(commissionRate),
              commissionAmount: commissionAmt,
              netAmount,
              status: "pending",
              paymentId: row.paymentId,
            });
          }

          await tx.insert(notifications).values({
            userId: recipientId,
            type: "payout_released",
            title: "Payment Released from Escrow",
            body: `MYR ${(netAmount / 100).toLocaleString()} has been released (commission: MYR ${(commissionAmt / 100).toLocaleString()}). It is now pending payout to your bank account.`,
            data: { link: "/dashboard/artist", bookingId: row.bookingId },
          });

          await logAudit(tx, {
            actorId: "system",
            action: "payment.released",
            entityType: "payment",
            entityId: String(row.paymentId),
            meta: {
              bookingId: row.bookingId,
              recipientId,
              grossAmount: row.paymentAmount,
              commissionRate,
              commissionAmount: commissionAmt,
              netAmount,
            },
          });
        });

        if (row.userId) {
          awardPoints(row.userId, "booking_completed", String(row.bookingId), `Booking #${row.bookingId} completed`).catch(() => {});
        }

        released += 1;
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: commissionAmt,
          netAmount,
          released: true,
          reason: "released",
        });
      } catch (err) {
        errors += 1;
        console.error(`[auto-release] failed for payment ${row.paymentId}:`, err);
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: 0,
          netAmount: 0,
          released: false,
          reason: `error: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    await recordCronRun("auto-release-payments", "success", `Released ${released}, skipped ${skipped}, errors ${errors}`);

    return NextResponse.json({
      success: true,
      dryRun,
      checked: rows.length,
      released,
      skipped,
      errors,
      details,
    });
  } catch (err) {
    console.error("[cron/auto-release-payments] error:", err);
    await recordCronRun("auto-release-payments", "error", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Auto-release failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  } finally {
    await releaseLock();
  }
}
