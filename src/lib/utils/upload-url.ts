/**
 * URL safety helpers for user-supplied image URLs.
 *
 * The dashboard's portfolio page lets artists paste an image URL directly
 * (in addition to uploading). Those URLs end up in the database and get
 * rendered as <img src> and <a href>. We need to keep them safe from:
 *  - XSS via `javascript:` / `data:` schemes
 *  - SSRF if any server-side code ever fetches the URL
 *  - open-redirect chains via `target="_blank"`
 */

const ALLOWED_HOST_SUFFIXES = [
  "res.cloudinary.com",
  "cloudinary.com",
  "images.unsplash.com",
  "plus.unsplash.com",
];

/**
 * Returns true if the URL is a safe https:// image URL on an allowlisted host.
 */
export function isAllowedImageUrl(value: string): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/**
 * Sanitize a user-pasted URL, returning the trimmed form if valid or null.
 * Use this for any string that ends up in DB or rendered into href/src.
 */
export function sanitizeImageUrl(value: string): string | null {
  if (!isAllowedImageUrl(value)) return null;
  return value.trim();
}
