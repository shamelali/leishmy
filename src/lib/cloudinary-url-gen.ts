/**
 * Client-safe Cloudinary URL builder using @cloudinary/url-gen.
 *
 * Replaces the manual string-concat in `cloudinary-client.ts`. Only uses
 * the public `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — no API secret ever
 * touches the client bundle.
 */

import { Cloudinary } from "@cloudinary/url-gen";
import { fill, scale, fit } from "@cloudinary/url-gen/actions/resize";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import RoundCornersAction from "@cloudinary/transformation-builder-sdk/actions/roundCorners/RoundCornersAction";

let _cld: Cloudinary | null = null;

function getCld(): Cloudinary | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;
  if (!_cld) {
    _cld = new Cloudinary({ cloud: { cloudName } });
  }
  return _cld;
}

export interface CldImageOptions {
  width?: number;
  height?: number;
  aspectRatio?: string;
  crop?: "fill" | "fit" | "scale";
  quality?: number | "auto";
  format?: "auto" | string;
  radius?: number;
  effect?: string;
}

/**
 * Build a Cloudinary delivery URL for a publicId using @cloudinary/url-gen.
 *
 * Returns the bare publicId if no cloudName is configured — same fallback
 * behavior as the old `cloudinaryUrl()` so callers can pass either form.
 */
export function cldImage(publicId: string, options: CldImageOptions = {}): string {
  const cld = getCld();
  if (!cld) return publicId;

  const {
    width,
    height,
    aspectRatio,
    crop = "fill",
    quality: q = "auto",
    format: f = "auto",
    radius,
    effect,
  } = options;

  let img = cld.image(publicId).delivery(format(f)).delivery(quality(String(q)));

  if (width || height || aspectRatio) {
    const resize =
      crop === "fit"
        ? fit()
        : crop === "scale"
          ? scale()
          : fill().gravity(autoGravity());

    if (width !== undefined) resize.width(width);
    if (height !== undefined) resize.height(height);
    if (aspectRatio) resize.aspectRatio(aspectRatio);

    img = img.resize(resize);
  }

  if (radius) {
    img = img.roundCorners(new RoundCornersAction().max());
  }

  if (effect) {
    img = img.effect(effect as never);
  }

  return img.toURL();
}

/**
 * Build a responsive srcSet for a Cloudinary image at the given widths.
 * Returns an object compatible with next/image's `loader` output.
 */
export function cldSrcSet(
  publicId: string,
  options: CldImageOptions = {},
  widths: number[] = [320, 640, 960, 1280, 1920],
): string {
  return widths
    .map((w) => `${cldImage(publicId, { ...options, width: w })} ${w}w`)
    .join(", ");
}
