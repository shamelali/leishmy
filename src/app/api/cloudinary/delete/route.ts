import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { limit } from "@/lib/rate-limit";
import { deleteAssetsSchema } from "@/lib/validations/cloudinary";
import {
  deleteAssets,
  isAdminScopedPublicId,
  isOwnerScopedPublicId,
} from "@/lib/cloudinary-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cloudinary/delete
 *
 * Body: { publicIds: string[] } — 1 to 12 Cloudinary publicIds.
 *
 * Auth:
 *  - Authenticated user OR admin
 *  - Each publicId MUST be in the caller's namespace
 *      (leish/users/{session.id}/...) — OR session.role === "admin",
 *      in which case any publicId under leish/ is allowed.
 *  - All-or-nothing: if ANY publicId fails the auth check, the request
 *    returns 403 and ZERO destroy calls are made.
 */
export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await limit(`cloudinary-delete:${session.id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many delete requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { error: "Delete service is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = deleteAssetsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { publicIds } = parsed.data;
  const isAdmin = hasAdminAccess(session);

  const failedChecks: string[] = [];
  for (const publicId of publicIds) {
    const allowed = isAdmin
      ? isAdminScopedPublicId(publicId)
      : isOwnerScopedPublicId(publicId, session.id);
    if (!allowed) failedChecks.push(publicId);
  }

  if (failedChecks.length > 0) {
    return NextResponse.json(
      {
        error: "One or more publicIds are outside the authorized scope",
        failedChecks,
      },
      { status: 403 },
    );
  }

  try {
    const results = await deleteAssets(publicIds);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[cloudinary/delete] unexpected error:", err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 },
    );
  }
}
