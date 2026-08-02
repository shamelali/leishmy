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
  const eventType = body.notification_type || body.event || "unknown";
  await db.insert(webhookEvents).values({
    event: "cloudinary." + eventType,
    payload: body,
    status: "received",
  });

  // Handle specific events (Cloudinary uses notification_type in the payload)
  switch (eventType) {
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
  // Cloudinary delete payload: { notification_type: "delete", resources: [{ public_id, ... }] }
  const resources = body.resources;
  if (!Array.isArray(resources) || resources.length === 0) {
    console.warn("Cloudinary delete event missing resources array");
    return;
  }

  const publicIds = resources
    .map((r: Record<string, any>) => r.public_id)
    .filter(Boolean);

  if (publicIds.length === 0) {
    console.warn("Cloudinary delete event resources have no public_ids");
    return;
  }

  // Find profiles whose portfolio array contains a URL referencing any deleted public_id.
  const profilesResult = await db
    .select({ userId: profiles.userId, portfolio: profiles.portfolio })
    .from(profiles)
    .where(and(isNotNull(profiles.portfolio), eq(profiles.role, "artist")));

  let cleanedCount = 0;
  for (const row of profilesResult) {
    const portfolio = row.portfolio;
    if (!portfolio || portfolio.length === 0) continue;

    const filtered = portfolio.filter(
      (url) => !publicIds.some((pid) => url.includes(pid)),
    );

    if (filtered.length === portfolio.length) continue; // no match

    await db
      .update(profiles)
      .set({ portfolio: filtered, updatedAt: new Date() })
      .where(eq(profiles.userId, row.userId));

    cleanedCount++;
    const removed = portfolio.length - filtered.length;
    console.log(
      `[cloudinary:webhook] cleaned ${removed} deleted asset(s) from profile ${row.userId} (${portfolio.length} → ${filtered.length} images)`,
    );
  }

  if (cleanedCount === 0) {
    console.log(
      `[cloudinary:webhook] delete event for ${publicIds.length} asset(s) — no referencing profiles found`,
    );
  }
}

async function handleUploadEvent(body: Record<string, any>) {
}

async function handleReplaceEvent(body: Record<string, any>) {
}

async function handleUpdateEvent(body: Record<string, any>) {
}