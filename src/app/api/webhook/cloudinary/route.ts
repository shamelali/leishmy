import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prefixedEnvReader } from "@/lib/env-prefix";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { deleteAssets } from "@/lib/cloudinary-server";

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
      console.log("Unhandled Cloudinary event:", body.event);
  }

  return NextResponse.json({ success: true });
}

async function handleDeleteEvent(body: Record<string, any>) {
  // body contains: public_id, resource_type, type, etc.
  const { public_id, resource_type } = body;
  console.log(`Cloudinary delete: ${public_id} (${resource_type})`);
  // Could trigger local DB cleanup if tracking assets
}

async function handleUploadEvent(body: Record<string, any>) {
  // body contains: public_id, secure_url, width, height, format, bytes, etc.
  const { public_id, secure_url, width, height, format, bytes, tags, context } =
    body;
  console.log(`Cloudinary upload: ${public_id} (${format}, ${bytes} bytes)`);
  // Could store asset metadata in DB, trigger processing, etc.
}

async function handleReplaceEvent(body: Record<string, any>) {
  // Similar to upload but for asset replacement
  const { public_id, secure_url } = body;
  console.log(`Cloudinary replace: ${public_id}`);
}

async function handleUpdateEvent(body: Record<string, any>) {
  // Metadata updates (tags, context, etc.)
  const { public_id, tags, context } = body;
  console.log(`Cloudinary update: ${public_id}`);
}