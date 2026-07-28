import { createHmac } from "crypto";

export function billplzSignature(body: string): string {
  const key = process.env.BILLPLZ_SIGNATURE_KEY;
  if (!key) throw new Error("BILLPLZ_SIGNATURE_KEY is not set");
  return createHmac("sha256", key).update(body).digest("hex");
}

export function billplzWebhookPayload(params: Record<string, string>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, v);
  }
  return qs.toString();
}