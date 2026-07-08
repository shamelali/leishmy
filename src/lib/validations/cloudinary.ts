import { z } from "zod";

/**
 * Validates a publicId before we pass it to the Cloudinary Admin API.
 *
 * Rules (defense in depth — the auth check is the real boundary):
 *  - Must start with the app's root prefix `leish/`
 *  - Each path segment is `[a-zA-Z0-9_\-.]+` (one or more allowed chars)
 *  - Segments are separated by single `/`
 *  - No empty segments (`//`), no `..` segments
 *  - No leading/trailing slashes beyond the prefix
 *  - Length capped at 255 (Cloudinary's publicId max)
 */
const publicIdSegment = "[a-zA-Z0-9_\\-.]+";
const publicIdRegex = new RegExp(
  `^leish/${publicIdSegment}(/${publicIdSegment})*$`,
);

export const cloudinaryPublicIdSchema = z
  .string()
  .min(1, "publicId is required")
  .max(255, "publicId too long")
  .regex(publicIdRegex, "Invalid publicId")
  .refine(
    (v) => !v.split("/").some((seg) => seg === "" || seg === "." || seg === ".."),
    "Invalid publicId",
  );

export const deleteAssetsSchema = z.object({
  publicIds: z
    .array(cloudinaryPublicIdSchema)
    .min(1, "At least one publicId is required")
    .max(12, "Maximum 12 publicIds per request"),
});

export type CloudinaryPublicId = z.infer<typeof cloudinaryPublicIdSchema>;
export type DeleteAssetsInput = z.infer<typeof deleteAssetsSchema>;
