import crypto from "crypto";

const CRON_SECRET_HEADER = "x-cron-secret";

export function verifyCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const authorization = request.headers.get("authorization");
  const bearerSecret = authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
  const provided = request.headers.get(CRON_SECRET_HEADER) || bearerSecret;
  if (!provided) return false;

  try {
    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(provided);
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}
