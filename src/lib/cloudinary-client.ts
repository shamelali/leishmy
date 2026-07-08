import { cldImage, type CldImageOptions } from "@/lib/cloudinary-url-gen";

/**
 * @deprecated Use `cldImage` from `@/lib/cloudinary-url-gen` directly.
 * This re-export exists for backward compatibility with existing callers.
 */
export const cloudinaryUrl = cldImage;

export function isCloudinaryUrl(url: string): boolean {
  return url?.includes("res.cloudinary.com");
}

/**
 * Extract the publicId from a stored Cloudinary URL.
 * Returns null for non-Cloudinary URLs (e.g. pasted external images).
 *
 * Examples:
 *   https://res.cloudinary.com/democloud/image/upload/v123/leish/users/u/artist/portfolio/p_1.jpg
 *     -> "leish/users/u/artist/portfolio/p_1"
 *   https://res.cloudinary.com/democloud/image/upload/leish/users/u/artist/portfolio/p_1.jpg
 *     -> "leish/users/u/artist/portfolio/p_1"
 */
export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

export type { CldImageOptions };
