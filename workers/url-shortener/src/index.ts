const BASE62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RECENT_CLICKS = 100;

interface Env {
  URL_MAP: KVNamespace;
  ANALYTICS: KVNamespace;
}

interface URLRecord {
  url: string;
  createdAt: string;
  custom: boolean;
}

interface ClickEvent {
  timestamp: string;
  referer: string;
  userAgent: string;
  country: string;
}

interface AnalyticsData {
  totalClicks: number;
  recentClicks: ClickEvent[];
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

function generateCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += BASE62[bytes[i] % BASE62.length];
  }
  return code;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getClientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function checkRateLimit(env: Env, ip: string): Promise<RateLimitResult> {
  const key = `rl:${ip}`;
  const now = Date.now();
  const data = await env.URL_MAP.get(key);

  let entry: RateLimitEntry;
  if (data) {
    entry = JSON.parse(data);
    if (now > entry.resetAt) {
      entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    }
  } else {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  await env.URL_MAP.put(key, JSON.stringify(entry), { expirationTtl: 120 });
  return { allowed: true };
}

async function generateUniqueCode(env: Env): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const existing = await env.URL_MAP.get(`url:${code}`);
    if (!existing) {
      return code;
    }
  }
  throw new Error("Failed to generate unique code");
}

async function recordAnalytics(env: Env, code: string, request: Request): Promise<void> {
  const clickEvent: ClickEvent = {
    timestamp: new Date().toISOString(),
    referer: request.headers.get("Referer") || "",
    userAgent: request.headers.get("User-Agent") || "",
    country: request.cf?.country || "unknown",
  };

  const existing = await env.ANALYTICS.get(`analytics:${code}`);
  const data: AnalyticsData = existing
    ? JSON.parse(existing)
    : { totalClicks: 0, recentClicks: [] };

  data.totalClicks++;
  data.recentClicks.unshift(clickEvent);
  if (data.recentClicks.length > MAX_RECENT_CLICKS) {
    data.recentClicks = data.recentClicks.slice(0, MAX_RECENT_CLICKS);
  }

  await env.ANALYTICS.put(`analytics:${code}`, JSON.stringify(data));
}

async function handleShorten(request: Request, env: Env): Promise<Response> {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(env, ip);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfter || 60),
        },
      }
    );
  }

  let body: { url?: string; customCode?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body?.url || typeof body.url !== "string") {
    return new Response(JSON.stringify({ error: "Missing or invalid url field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const trimmedUrl = body.url.trim();
  if (!isValidUrl(trimmedUrl)) {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let code: string;
  if (body.customCode) {
    code = body.customCode;
    if (code.length < 3 || code.length > 20) {
      return new Response(
        JSON.stringify({ error: "Custom code must be between 3 and 20 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Custom code can only contain alphanumeric characters, hyphens, and underscores" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const existing = await env.URL_MAP.get(`url:${code}`);
    if (existing) {
      return new Response(JSON.stringify({ error: "Custom code already taken" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    code = await generateUniqueCode(env);
  }

  const record: URLRecord = {
    url: trimmedUrl,
    createdAt: new Date().toISOString(),
    custom: !!body.customCode,
  };

  await env.URL_MAP.put(`url:${code}`, JSON.stringify(record));

  const baseUrl = getBaseUrl(request);
  const shortUrl = `${baseUrl}/${code}`;

  return new Response(JSON.stringify({ shortCode: code, shortUrl, url: trimmedUrl }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleRedirect(code: string, request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(env, ip);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfter || 60),
        },
      }
    );
  }

  const recordStr = await env.URL_MAP.get(`url:${code}`);
  if (!recordStr) {
    return new Response(JSON.stringify({ error: "Short URL not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = JSON.parse(recordStr) as URLRecord;

  ctx.waitUntil(recordAnalytics(env, code, request));

  return Response.redirect(record.url, 302);
}

async function handleStats(code: string, env: Env): Promise<Response> {
  const recordStr = await env.URL_MAP.get(`url:${code}`);
  if (!recordStr) {
    return new Response(JSON.stringify({ error: "Short URL not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const analytics = await env.ANALYTICS.get(`analytics:${code}`);
  const data: AnalyticsData = analytics ? JSON.parse(analytics) : { totalClicks: 0, recentClicks: [] };

  return new Response(
    JSON.stringify({ shortCode: code, totalClicks: data.totalClicks, recentClicks: data.recentClicks }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/shorten" && request.method === "POST") {
      return handleShorten(request, env);
    }

    if (path.startsWith("/api/stats/")) {
      const code = path.substring("/api/stats/".length);
      return handleStats(code, env);
    }

    if (path === "/" || path === "/favicon.ico") {
      return new Response("URL Shortener", { status: 200 });
    }

    if (!path.startsWith("/api/")) {
      const code = path.substring(1);
      if (code) {
        return handleRedirect(code, request, env, ctx);
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
};

export default worker;