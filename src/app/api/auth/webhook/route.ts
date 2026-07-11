import { NextRequest, NextResponse } from "next/server";
import { createPublicKey, verify } from "node:crypto";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { prefixedEnvReader } from "@/lib/env-prefix";

export const runtime = "nodejs";

const neauth = prefixedEnvReader("NEON_AUTH_");

let jwksCache: { keys: { kid: string; x: string; crv: string; kty: string }[] } | null = null;
let jwksFetching: Promise<void> | null = null;

async function getJwks() {
  if (jwksCache) return jwksCache;
  if (jwksFetching) await jwksFetching;
  const baseUrl = neauth.get("BASE_URL");
  if (!baseUrl) throw new Error("NEON_AUTH_BASE_URL is not configured");
  const jwksUrl = baseUrl.replace(/\/auth$/, "") + "/.well-known/jwks.json";
  jwksFetching = fetch(jwksUrl).then(async (res) => {
    jwksCache = await res.json();
    jwksFetching = null;
    setTimeout(() => { jwksCache = null; }, 300_000);
  });
  await jwksFetching;
  return jwksCache!;
}

async function verifyWebhook(rawBody: string, headers: Headers) {
  const signature = headers.get("x-neon-signature");
  const kid = headers.get("x-neon-signature-kid");
  const timestamp = headers.get("x-neon-timestamp");

  if (!signature || !kid || !timestamp) {
    return { valid: false, error: "Missing webhook signature headers" };
  }

  const ageMs = Date.now() - parseInt(timestamp, 10);
  if (ageMs > 5 * 60 * 1000) {
    return { valid: false, error: "Webhook timestamp too old" };
  }

  const jwks = await getJwks();
  const jwk = jwks.keys.find((k) => k.kid === kid);
  if (!jwk) {
    return { valid: false, error: `Key ${kid} not found in JWKS` };
  }

  const [headerB64, emptyPayload, signatureB64] = signature.split(".");
  if (emptyPayload !== "") {
    return { valid: false, error: "Expected detached JWS format" };
  }

  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const payloadB64 = Buffer.from(rawBody, "utf-8").toString("base64url");
  const signaturePayload = `${timestamp}.${payloadB64}`;
  const signaturePayloadB64 = Buffer.from(signaturePayload, "utf-8").toString("base64url");
  const signingInput = `${headerB64}.${signaturePayloadB64}`;

  const isValid = verify(
    null,
    Buffer.from(signingInput),
    publicKey,
    Buffer.from(signatureB64, "base64url"),
  );

  if (!isValid) {
    return { valid: false, error: "Invalid webhook signature" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const verification = await verifyWebhook(rawBody, request.headers);
  if (!verification.valid) {
    return NextResponse.json({ error: verification.error }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const eventType = body.event_type || "unknown";

    await db.insert(webhookEvents).values({
      event: `neon-auth.${eventType}`,
      payload: body,
      status: "received",
    });

    if (eventType === "user.before_create") {
      return NextResponse.json({ allowed: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Neon Auth webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
