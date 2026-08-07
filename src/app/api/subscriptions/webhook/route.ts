import { NextRequest, NextResponse } from "next/server";
import { handleSubscriptionWebhook } from "@/lib/billplz/subscription-webhook";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-signature") || "";

  const { status, body } = await handleSubscriptionWebhook(rawBody, signatureHeader);

  return NextResponse.json(body, { status });
}
