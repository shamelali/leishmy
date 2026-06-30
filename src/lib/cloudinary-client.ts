export function cloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    aspectRatio?: string;
    crop?: string;
    quality?: number | "auto";
    format?: string;
    radius?: number;
    effect?: string;
  },
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return publicId;

  const {
    width, height, aspectRatio, crop = "fill",
    quality = "auto", format = "auto", radius, effect,
  } = options || {};

  const transformations: string[] = ["f_auto", `q_${quality}`];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (aspectRatio) transformations.push(`ar_${aspectRatio}`);
  transformations.push(`c_${crop}`);
  if (radius) transformations.push(`r_${radius}`);
  if (effect) transformations.push(`e_${effect}`);

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join(",")}/${publicId}`;
}

export function isCloudinaryUrl(url: string): boolean {
  return url?.includes("res.cloudinary.com");
}

export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}
