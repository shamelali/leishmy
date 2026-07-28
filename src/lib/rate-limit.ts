import { Redis } from "@upstash/redis";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const inMemory = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of inMemory) {
    if (val.resetAt <= now) inMemory.delete(key);
  }
}, CLEANUP_INTERVAL);
if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();

let lookupsSinceCleanup = 0;

async function limit(identifier: string): Promise<RateLimitResult> {
  if (!redis) {
    lookupsSinceCleanup++;
    if (lookupsSinceCleanup >= 100) {
      const now = Date.now();
      for (const [key, val] of inMemory) {
        if (val.resetAt <= now) inMemory.delete(key);
      }
      lookupsSinceCleanup = 0;
    }

    const now = Date.now();
    const record = inMemory.get(identifier);
    if (record && record.resetAt > now) {
      const success = record.count <= 60;
      record.count++;
      return {
        success,
        remaining: Math.max(0, 60 - record.count),
        reset: record.resetAt,
      };
    }
    inMemory.set(identifier, { count: 1, resetAt: now + 60_000 });
    return { success: true, remaining: 59, reset: now + 60_000 };
  }

  try {
    const key = `leish:rl:${identifier}`;
    const max = 60;
    const window = 60;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, window);
    }

    const success = count <= max;
    const remaining = Math.max(0, max - count);
    const ttl = await redis.ttl(key);
    const reset = Date.now() + (ttl > 0 ? ttl * 1000 : window * 1000);

    return { success, remaining, reset };
  } catch (err) {
    console.error("Rate limiter Redis error, falling back to in-memory:", err);
    const now = Date.now();
    const record = inMemory.get(identifier);
    if (record && record.resetAt > now) {
      const success = record.count <= 60;
      record.count++;
      return {
        success,
        remaining: Math.max(0, 60 - record.count),
        reset: record.resetAt,
      };
    }
    inMemory.set(identifier, { count: 1, resetAt: now + 60_000 });
    return { success: true, remaining: 59, reset: now + 60_000 };
  }
}

export { limit };
