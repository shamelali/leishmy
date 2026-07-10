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

async function limit(identifier: string): Promise<RateLimitResult> {
  if (!redis) {
    return { success: true, remaining: 999, reset: 0 };
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
  } catch {
    console.error("Rate limiter error");
    return { success: true, remaining: 999, reset: 0 };
  }
}

export { limit };
