import { NextRequest, NextResponse } from "next/server";
import { runSweep } from "@/lib/cloudinary-sweep";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOCK_KEY = "leish:sweep:orphans:lock";
const LOCK_TTL_SECONDS = 10 * 60;
const CRON_SECRET_HEADER = "x-cron-secret";

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

/**
 * POST /api/cron/sweep-orphans
 *
 * Auth: x-cron-secret header (or ?secret= for browser-less curls) must
 * match CRON_SECRET env var. Returns 503 if CRON_SECRET is not configured.
 *
 * Vercel Cron hits this daily at 03:00 UTC (see vercel.json). Manual
 * invocation: `curl -X POST -H "x-cron-secret: $CRON_SECRET" $URL/api/cron/sweep-orphans`.
 *
 * Body: { dryRun?: boolean } — defaults to false (real delete) for cron,
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
      { error: "Sweep already running" },
      { status: 409 },
    );
  }

  try {
    let dryRun = false;
    try {
      const body = (await request.json()) as { dryRun?: boolean };
      dryRun = body.dryRun === true;
    } catch {
      // Empty body is fine; default to real delete.
    }

    const summary = await runSweep({ dryRun });
    return NextResponse.json({ success: true, dryRun, ...summary });
  } catch (err) {
    console.error("[cron/sweep-orphans] error:", err);
    return NextResponse.json(
      { error: "Sweep failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  } finally {
    await releaseLock();
  }
}
