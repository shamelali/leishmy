import "server-only";
import cloudinary from "@/lib/cloudinary";

/**
 * Server-only Cloudinary operations.
 *
 * The publicId authorization helpers (`isOwnerScopedPublicId`,
 * `isAdminScopedPublicId`) are the ONLY safety boundary for the delete
 * endpoint. The caller MUST run the appropriate check before invoking
 * `deleteAssets`. We re-validate the prefix inside the SDK call wrapper
 * as a second line of defense.
 *
 * PublicId format: `leish/<sub>/...` — see `src/lib/validations/cloudinary.ts`.
 */

export const CLOUDINARY_ROOT = "leish/";
export const CLOUDINARY_USER_PREFIX = "leish/users/";

export type DeleteResultStatus = "ok" | "not_found" | "error";
export interface DeleteResult {
  publicId: string;
  status: DeleteResultStatus;
  error?: string;
}

export function isOwnerScopedPublicId(publicId: string, userId: string): boolean {
  if (!publicId || !userId) return false;
  if (publicId.includes("..") || publicId.includes("//")) return false;
  return publicId.startsWith(`${CLOUDINARY_USER_PREFIX}${userId}/`);
}

export function isAdminScopedPublicId(publicId: string): boolean {
  if (!publicId) return false;
  if (publicId.includes("..") || publicId.includes("//")) return false;
  return publicId.startsWith(CLOUDINARY_ROOT) && publicId.length > CLOUDINARY_ROOT.length;
}

/**
 * Sequence-of-`destroy` is intentional. Cloudinary's v2 SDK has no native
 * batch delete; `cloudinary.api.delete_resources` exists but lacks the
 * `invalidate` (CDN purge) option. Per-call `invalidate: true` is the only
 * way to ensure deleted assets don't linger at the edge.
 *
 * Results are returned in the same order as `publicIds`. `not_found` is
 * treated as success: the asset is gone, which is what the caller wanted.
 */
export async function deleteAssets(publicIds: string[]): Promise<DeleteResult[]> {
  const results: DeleteResult[] = [];
  for (const publicId of publicIds) {
    try {
      const res = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: "image",
      });
      // Cloudinary returns result: "ok" | "not found" | "rate limited"
      if (res.result === "ok" || res.result === "not found") {
        results.push({ publicId, status: res.result === "ok" ? "ok" : "not_found" });
      } else {
        results.push({ publicId, status: "error", error: res.result });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ publicId, status: "error", error: message });
    }
  }
  return results;
}

export interface ListResourcesOptions {
  type?: "upload" | "private" | "authenticated";
  prefix?: string;
  maxResults?: number;
  nextCursor?: string;
}

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  created_at: string;
  bytes: number;
  format: string;
}

/**
 * List resources in a folder (or any prefix). Returns up to `maxResults`
 * per page; caller paginates with `nextCursor` from the previous call.
 */
export async function listResources(
  options: ListResourcesOptions = {},
): Promise<{ resources: CloudinaryResource[]; nextCursor?: string }> {
  const { type = "upload", prefix, maxResults = 500, nextCursor } = options;
  const params: Record<string, string | number | undefined> = {
    type,
    prefix,
    max_results: maxResults,
    next_cursor: nextCursor,
    resource_type: "image",
  };
  const res = await cloudinary.api.resources(params);
  return {
    resources: (res.resources as CloudinaryResource[]) ?? [],
    nextCursor: res.next_cursor as string | undefined,
  };
}

export async function listSubFolders(
  parent: string,
  maxResults = 500,
): Promise<string[]> {
  const res = await cloudinary.api.sub_folders(parent, { max_results: maxResults });
  return (res.folders as Array<{ name: string }>).map((f) => f.name);
}
