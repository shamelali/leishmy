/**
 * Browser-side helper for /api/cloudinary/delete.
 *
 * Filters out synthetic publicIds (existing-*, url-*) and non-Cloudinary
 * URLs — only Cloudinary-hosted assets are forwarded to the server.
 */

import { isCloudinaryUrl } from "@/lib/cloudinary-client";

const CLOUDINARY_PUBLICID_REGEX = /^leish\/[a-zA-Z0-9_\-./]+$/;
const SYNTHETIC_PREFIXES = ["existing-", "url-"];

function isDeletablePublicId(publicId: string): boolean {
  if (!publicId) return false;
  if (SYNTHETIC_PREFIXES.some((p) => publicId.startsWith(p))) return false;
  return CLOUDINARY_PUBLICID_REGEX.test(publicId);
}

export interface DeleteAssetsResponse {
  results?: Array<{ publicId: string; status: string; error?: string }>;
  failedChecks?: string[];
  error?: string;
}

/**
 * Delete a batch of Cloudinary assets by publicId. Returns the server's
 * result object on a 200 response, or throws with a useful message
 * otherwise. Network errors and non-2xx are both surfaced as throws.
 */
export async function deleteCloudinaryAssets(publicIds: string[]): Promise<DeleteAssetsResponse> {
  const filtered = publicIds.filter(isDeletablePublicId);
  if (filtered.length === 0) {
    return { results: [] };
  }

  const res = await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicIds: filtered }),
  });

  const data = (await res.json().catch(() => ({}))) as DeleteAssetsResponse;

  if (!res.ok) {
    const message = data?.error || `Delete failed (HTTP ${res.status})`;
    const err = new Error(message) as Error & { failedChecks?: string[] };
    err.failedChecks = data?.failedChecks;
    throw err;
  }

  return data;
}

export function isSyntheticPublicId(publicId: string): boolean {
  return SYNTHETIC_PREFIXES.some((p) => publicId.startsWith(p));
}

export { isCloudinaryUrl };
