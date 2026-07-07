import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
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

  const userScopedFolder = `leish/users/${session.id}/artist/${folder
    .replace(/^leish\//, "")
    .replace(/[^a-z0-9_\-/]/gi, "")}`;
  if (!userScopedFolder.startsWith(`leish/users/${session.id}/`)) {
    return jsonError("Folder must be scoped to the current user", 400);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const eagerTransforms =
    resourceType === "image"
      ? "f_auto,q_auto,w_1600,c_limit"
      : "f_auto,q_auto";

  // Server-enforced ceiling: client may ask for a smaller cap, never larger.
  const serverCap = resourceType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  const effectiveCap =
    maxBytes !== undefined ? Math.min(maxBytes, serverCap) : serverCap;

  const params: Record<string, string | number> = {
    timestamp,
    folder: userScopedFolder,
    eager: eagerTransforms,
  };

  const allowedFormats =
    resourceType === "image" ? ALLOWED_IMAGE_FORMATS : ALLOWED_VIDEO_FORMATS;
  params.allowed_formats = allowedFormats.join(",");
  params.max_file_size = effectiveCap;

  if (publicIdPrefix) {
    const safePrefix = publicIdPrefix.replace(/[^a-zA-Z0-9_\-]/g, "");
    params.public_id = `${safePrefix}_${timestamp}`;
  }

  const toSign = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const signature = crypto
    .createHash("sha256")
    .update(toSign + apiSecret)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: userScopedFolder,
    eager: eagerTransforms,
    allowedFormats,
    maxFileSize: effectiveCap,
    resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
  });
}
