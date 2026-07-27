import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, payouts, bookings, notifications } from "@/db/schema";
import { eq, sql, and, lte } from "drizzle-orm";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOCK_KEY = "leish:auto-release:lock";
const LOCK_TTL_SECONDS = 10 * 60;
const CRON_SECRET_HEADER = "x-cron-secret";
const COOLING_DAYS = 3;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

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

  const headerSecret = request.headers.get(CRON_SECRET_HEADER);
  const urlSecret = new URL(request.url).searchParams.get("secret");
  const provided = headerSecret || urlSecret || "";
  if (provided !== expected) return unauthorized();

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
      released: boolean;
      reason: string;
    }[] = [];

    let released = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      const recipientId = row.artistId || row.studioId;

      if (!recipientId) {
        skipped += 1;
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId: null,
          amount: row.paymentAmount,
          released: false,
          reason: "no artistId or studioId on booking",
        });
        continue;
      }

      if (dryRun) {
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
          released: false,
          reason: "dry run",
        });
        continue;
      }

      try {
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
              status: "pending",
              paymentId: row.paymentId,
            });
          }

          await tx.insert(notifications).values({
            userId: recipientId,
            type: "payout_released",
            title: "Payment Released from Escrow",
            body: `MYR ${(row.paymentAmount / 100).toLocaleString()} has been released from escrow. It is now pending payout to your bank account.`,
            data: { link: "/dashboard/artist" },
          });
        });

        released += 1;
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
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
          released: false,
          reason: `error: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

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
    return NextResponse.json(
      { error: "Auto-release failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  } finally {
    await releaseLock();
  }
}
