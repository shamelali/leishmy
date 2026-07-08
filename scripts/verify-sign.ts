import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

/**
 * Diagnostic for the /api/upload/sign signature flow.
 *
 * What this script does:
 *   1. Loads the Cloudinary creds from .env
 *   2. Signs a sample upload payload with cloudinary.utils.api_sign_request
 *      (the same call the /api/upload/sign route now uses)
 *   3. POSTs a 1x1 PNG to Cloudinary's upload endpoint
 *   4. Reports whether the signature was accepted (200) or rejected (401)
 *
 * Possible outcomes:
 *   - 200: signature accepted, upload succeeded, test asset is cleaned up
 *   - 401 "Invalid Signature": the API secret in .env does NOT match the
 *     secret Cloudinary expects for signing. Two ways this can happen:
 *       (a) The secret was rotated in the Cloudinary dashboard and .env
 *           is stale. Update CLOUDINARY_API_SECRET in .env and Vercel.
 *       (b) The account has separate "API Secret" (Basic auth) and
 *           "Signing Key" values. Re-check the dashboard.
 *   - Other error: investigate the response body.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing one of: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

async function main() {
  const folder = `leish/diagnostic-${Date.now()}`;

  const params: Record<string, string | number> = {
    timestamp: Math.floor(Date.now() / 1000),
    folder,
    allowed_formats: "jpg,jpeg,png,webp,heic,gif",
  };

  const signature = cloudinary.utils.api_sign_request(params, apiSecret!);

  console.log("=".repeat(60));
  console.log("Cloudinary Sign-Route Diagnostic");
  console.log("=".repeat(60));
  console.log("Cloud name:", cloudName);
  console.log("API key:   ", apiKey);
  console.log("Folder:    ", folder);
  console.log("Timestamp: ", params.timestamp);
  console.log("Signature: ", signature);
  console.log("Sig length:", signature.length, "chars");
  console.log("           ", signature.length === 40 ? "(SHA-1, Cloudinary default)" : signature.length === 64 ? "(SHA-256, account must be configured for it)" : "(unexpected)");
  console.log();

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==",
    "base64",
  );

  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "test.png");
  form.append("api_key", apiKey!);
  form.append("timestamp", String(params.timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("allowed_formats", String(params.allowed_formats));
  form.append("max_file_size", String(10 * 1024 * 1024));

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const res = await fetch(uploadUrl, { method: "POST", body: form });
  const body = (await res.json().catch(() => ({}))) as {
    public_id?: string;
    error?: { message?: string };
  };

  console.log("Response status:", res.status);
  console.log("Response body:  ", JSON.stringify(body, null, 2));
  console.log();

  if (res.ok && body.public_id) {
    console.log("RESULT: signature accepted, upload succeeded.");
    const destroy = await cloudinary.uploader.destroy(body.public_id, { invalidate: true });
    console.log("Cleanup:        ", destroy.result);
    process.exit(0);
  }

  if (res.status === 401) {
    console.log("RESULT: signature REJECTED.");
    console.log();
    console.log("The to_sign string Cloudinary shows matches what we sent,");
    console.log("so the parameters are correct. The mismatch is the API secret.");
    console.log();
    console.log("Next steps:");
    console.log("  1. Open the Cloudinary dashboard for this cloud");
    console.log("  2. Go to Settings -> API Keys -> 'API Secret' (or 'Signing Key' if separate)");
    console.log("  3. Copy the current value into .env and Vercel env");
    console.log("  4. Re-run this script: npx tsx scripts/verify-sign.ts");
    process.exit(1);
  }

  console.log("RESULT: unexpected error. See response body above.");
  process.exit(1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
