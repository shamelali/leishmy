import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { sql } from "drizzle-orm";
import { reconcilePayment } from "@/lib/payment-reconcile";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOCK_KEY = "leish:reconcile:payments:lock";
const LOCK_TTL_SECONDS = 10 * 60;
const CRON_SECRET_HEADER = "x-cron-secret";
const BILLPLZ_RATE_LIMIT_MS = 250;

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/cron/reconcile-payments
 *
 * Auth: x-cron-secret header (or ?secret=) must match CRON_SECRET env var.
 * Returns 503 if CRON_SECRET is not configured.
 *
 * Re-checks every payment still `pending`/`held` locally against Billplz.
 * Billplz webhooks are best-effort and occasionally fail to deliver (proven:
 * bill 6888bfb13549d2bd was paid but never POSTed a webhook). This cron
 * is the safety net that guarantees eventual consistency.
 *
 * Idempotent: only flips not-yet-paid rows. The shared reconcilePayment()
 * helper deliberately does NOT send a receipt email (the webhook owns that)
 * to avoid duplicates.
 *
 * Vercel Cron hits this daily at 03:30 UTC (see vercel.json). Manual:
 *   curl -X POST -H "x-cron-secret: $CRON_SECRET" $URL/api/cron/reconcile-payments
 *
 * Body: { dryRun?: boolean } — defaults to false (real update) for cron,
 * but can be set true for safe inspection.
 */
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
      { error: "Reconcile already running" },
      { status: 409 },
    );
  }

  try {
    let dryRun = false;
    try {
      const body = (await request.json()) as { dryRun?: boolean };
      dryRun = body.dryRun === true;
    } catch {
      // Empty body is fine; default to real update.
    }

    const rows = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        sql`${payments.status} IN ('pending', 'held') AND ${payments.billplzId} IS NOT NULL`,
      );

    const details: {
      paymentId: number;
      billplzId: string | null;
      billplzPaid: boolean | null;
      localStatus: string | null;
      updated: boolean;
    }[] = [];

    let checked = 0;
    let updated = 0;
    let failedLookups = 0;

    for (const row of rows) {
      const result = await reconcilePayment(row.id, { dryRun });
      checked += 1;
      if (result.billplzPaid === null) failedLookups += 1;
      if (result.updated) updated += 1;
      details.push({
        paymentId: result.paymentId,
        billplzId: result.billplzId,
        billplzPaid: result.billplzPaid,
        localStatus: result.localStatus,
        updated: result.updated,
      });
      await sleep(BILLPLZ_RATE_LIMIT_MS);
    }

    return NextResponse.json({
      success: true,
      dryRun,
      checked,
      updated,
      failedLookups,
      details,
    });
  } catch (err) {
    console.error("[cron/reconcile-payments] error:", err);
    return NextResponse.json(
      { error: "Reconcile failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  } finally {
    await releaseLock();
  }
}
