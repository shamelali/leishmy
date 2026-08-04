import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { prefixedEnvReader } from "@/lib/env-prefix";

export const runtime = "nodejs";

const whatsappEnv = prefixedEnvReader("WHATSAPP_");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  const expectedToken = whatsappEnv.get("WEBHOOK_SECRET");

  if (mode === "subscribe" && challenge && verifyToken === expectedToken) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  let body: Record<string, any>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await db.insert(webhookEvents).values({
    event: "whatsapp.message",
    payload: body,
    status: "received",
  });

  const entries = body.entry ?? [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      const value = change.value ?? {};
      const messages = value.messages ?? [];

      for (const message of messages) {
        const from = message.from;
        const messageType = message.type;

        if (messageType === "text") {
          const text = message.text?.body ?? "";
          console.log(`[whatsapp:webhook] Text from ${from}: ${text}`);
        } else if (messageType === "interactive") {
          const interactive = message.interactive;
          const responseType = interactive?.type;
          console.log(
            `[whatsapp:webhook] Interactive ${responseType} from ${from}: ${JSON.stringify(interactive)}`,
          );
        } else {
          console.log(
            `[whatsapp:webhook] ${messageType} from ${from}: ${JSON.stringify(message)}`,
          );
        }
      }

      if (value.statuses) {
        for (const status of value.statuses) {
          console.log(
            `[whatsapp:webhook] Status ${status.status} for ${status.id}`,
          );
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
