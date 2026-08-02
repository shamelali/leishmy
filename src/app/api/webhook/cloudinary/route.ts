import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { db } from "@/db";
import { profiles, webhookEvents } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";

export const runtime = "nodejs";

const cloudinaryEnv = prefixedEnvReader("CLOUDINARY_");

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const webhookSecret = cloudinaryEnv.get("WEBHOOK_SECRET");

  if (!webhookSecret) {
    console.error("Cloudinary webhook secret not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Verify signature from X-Cloudinary-Signature header
  const signatureHeader = request.headers.get("x-cloudinary-signature") || "";
  const computedSignature = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("base64");

  const headerBuf = Buffer.from(signatureHeader, "utf-8");
  const computedBuf = Buffer.from(computedSignature, "utf-8");

  if (
    headerBuf.length !== computedBuf.length ||
    !timingSafeEqual(headerBuf, computedBuf)
  ) {
    console.warn("Cloudinary webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Log webhook event
  await db.insert(webhookEvents).values({
    event: "cloudinary." + (body.event || "unknown"),
    payload: body,
    status: "received",
  });

  // Handle specific events
  switch (body.event) {
    case "delete":
      await handleDeleteEvent(body);
      break;
    case "upload":
      await handleUploadEvent(body);
      break;
    case "replace":
      await handleReplaceEvent(body);
      break;
    case "update":
      await handleUpdateEvent(body);
      break;
    default:
      break;
  }

  return NextResponse.json({ success: true });
}

async function handleDeleteEvent(body: Record<string, any>) {
  const publicId = body.public_id;
  if (!publicId) {
    console.warn("Cloudinary delete event missing public_id");
    return;
  }

  // Find profiles whose portfolio array contains a URL referencing this public_id.
  // Portfolio URLs look like: https://res.cloudinary.com/<cloud>/image/upload/.../<public_id>.jpg
  // We match by checking if the URL path ends with the public_id (with or without extension).
  const profilesResult = await db
    .select({ userId: profiles.userId, portfolio: profiles.portfolio })
    .from(profiles)
    .where(and(isNotNull(profiles.portfolio), eq(profiles.role, "artist")));

  let cleanedCount = 0;
  for (const row of profilesResult) {
    const portfolio = row.portfolio;
    if (!portfolio || portfolio.length === 0) continue;

    const filtered = portfolio.filter((url) => {
      // Match URLs that contain the deleted public_id as a path segment
      // e.g. ".../leish/users/xxx/artist/portfolio/p1.jpg" contains "leish/users/xxx/artist/portfolio/p1.jpg"
      return !url.includes(publicId);
    });

    if (filtered.length === portfolio.length) continue; // no match

    await db
      .update(profiles)
      .set({ portfolio: filtered, updatedAt: new Date() })
      .where(eq(profiles.userId, row.userId));

    cleanedCount++;
    console.log(
      `[cloudinary:webhook] removed deleted asset ${publicId} from profile ${row.userId} (${portfolio.length} → ${filtered.length} images)`,
    );
  }

  if (cleanedCount === 0) {
    console.log(
      `[cloudinary:webhook] delete event for ${publicId} — no referencing profiles found (already cleaned or external asset)`,
    );
  }
}

async function handleUploadEvent(body: Record<string, any>) {
}

async function handleReplaceEvent(body: Record<string, any>) {
}

async function handleUpdateEvent(body: Record<string, any>) {
}