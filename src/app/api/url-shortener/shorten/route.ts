import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { urls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { limit } from "@/lib/rate-limit";

const BASE62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

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

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function getBaseUrl(request: NextRequest): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const existing = await db.select().from(urls).where(eq(urls.code, code)).limit(1);
    if (existing.length === 0) {
      return code;
    }
  }
  throw new Error("Failed to generate unique code");
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await limit(`url-shorten:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: 60 },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    let body: { url?: string; customCode?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body?.url || typeof body.url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid url field" },
        { status: 400 }
      );
    }

    const trimmedUrl = body.url.trim();
    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    let code: string;
    if (body.customCode) {
      code = body.customCode;
      if (code.length < 3 || code.length > 20) {
        return NextResponse.json(
          { error: "Custom code must be between 3 and 20 characters" },
          { status: 400 }
        );
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
        return NextResponse.json(
          { error: "Custom code can only contain alphanumeric characters, hyphens, and underscores" },
          { status: 400 }
        );
      }
      const existing = await db.select().from(urls).where(eq(urls.code, code)).limit(1);
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Custom code already taken" },
          { status: 409 }
        );
      }
    } else {
      code = await generateUniqueCode();
    }

    const baseUrl = getBaseUrl(request);
    const shortUrl = `${baseUrl}/${code}`;

    await db.insert(urls).values({
      code,
      url: trimmedUrl,
      custom: !!body.customCode,
      clicks: 0,
    });

    return NextResponse.json(
      { shortCode: code, shortUrl, url: trimmedUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("URL shorten error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
