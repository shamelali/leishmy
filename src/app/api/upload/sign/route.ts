import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getAuthSession } from "@/lib/auth/server";
import { limit } from "@/lib/rate-limit";
import { uploadSignSchema } from "@/lib/validations/artist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Signing window: Cloudinary rejects signatures older than ~1 hour by default;
// our timestamps are always fresh (per-request), so the practical window is
// controlled by client retry behavior. The tighter 120s ceiling in the
// notifier header helps, but the signed timestamp itself is the source of truth.
const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "heic", "gif"];
const ALLOWED_VIDEO_FORMATS = ["mp4", "mov", "webm"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const rl = await limit(`upload-sign:${session.id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many upload requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return jsonError("Upload service is not configured", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = uploadSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { folder, publicIdPrefix, resourceType, maxBytes } = parsed.data;

  // Accept either "leish/portfolio" (with prefix) or "portfolio" (bare).
  // Strip and sanitize. The resulting folder is always prefixed with the
  // current user's id, so no user can write to another user's namespace.
  const strippedFolder = folder
    .replace(/^leish\//i, "")
    .replace(/[^a-z0-9_\-/]/gi, "");
  const userScopedFolder = `leish/users/${session.id}/artist/${strippedFolder}`;
  if (!userScopedFolder.startsWith(`leish/users/${session.id}/`)) {
    return jsonError("Folder must be scoped to the current user", 400);
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Server-enforced ceiling: client may ask for a smaller cap, never larger.
  const serverCap = resourceType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  const effectiveCap =
    maxBytes !== undefined ? Math.min(maxBytes, serverCap) : serverCap;

  // We deliberately do NOT include an `eager` transform. Eager transforms
  // run synchronously during upload and can fail the entire upload if the
  // source image is unusual (e.g. tiny, no width metadata, or some HEIC
  // variants). Format/quality negotiation is handled on delivery by
  // Cloudinary's CDN when the URL is fetched with f_auto/q_auto.
  //
  // `max_file_size` is a Cloudinary client hint (controls upload size limit)
  // but is NOT part of the signed to_sign — Cloudinary strips it before
  // computing the expected signature. We send it in the response so the
  // client can include it in the form body, but we must NOT include it
  // in the params passed to api_sign_request, or the signature will
  // mismatch and Cloudinary will reject the upload with 401.
  const params: Record<string, string | number> = {
    timestamp,
    folder: userScopedFolder,
  };

  const allowedFormats =
    resourceType === "image" ? ALLOWED_IMAGE_FORMATS : ALLOWED_VIDEO_FORMATS;
  params.allowed_formats = allowedFormats.join(",");

  let publicId: string | undefined;
  if (publicIdPrefix) {
    const safePrefix = publicIdPrefix.replace(/[^a-zA-Z0-9_\-]/g, "");
    publicId = `${safePrefix}_${timestamp}`;
    params.public_id = publicId;
  }

  // Use the Cloudinary SDK's signing helper. It defaults to SHA-1 with
  // signature version 2 (param encoding), which matches the account's
  // expected algo. The previous manual implementation used SHA-256,
  // which Cloudinary rejected.
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: userScopedFolder,
    allowedFormats,
    maxFileSize: effectiveCap,
    resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    publicId,
  });
}
