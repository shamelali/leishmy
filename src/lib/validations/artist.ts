import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(max));

const phoneSchema = z
  .string()
    .transform((v) => v.replace(/[\s\-()]/g, "").trim())
    .pipe(
      z
        .string()
        .regex(/^\+?[0-9]{7,15}$/, "Invalid phone number"),
    );

const optionalUrl = z
  .union([z.url("Must be a valid URL").max(500), z.literal("")])
  .optional();

const arrayOf = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z
    .array(item)
    .max(max, `Maximum ${max} items allowed`);

export const stepBasicsSchema = z.object({
  name: trimmed(255).pipe(z.string().min(2, "Name is too short")),
  email: z.string().trim().toLowerCase().email("Invalid email").max(255),
  phone: phoneSchema.optional().or(z.literal("")),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  location: trimmed(255).pipe(z.string().min(2, "Location is required")),
  area: trimmed(100).optional().or(z.literal("")),
  district: trimmed(100).optional().or(z.literal("")),
});
export type StepBasicsInput = z.infer<typeof stepBasicsSchema>;

export const stepProfessionalSchema = z.object({
  bio: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(40, "Bio must be at least 40 characters")
        .max(1000, "Bio must be at most 1000 characters"),
    ),
  experience: z
    .number()
    .int()
    .min(0)
    .max(80),
  languages: arrayOf(z.string().min(1).max(40), 10),
  specialties: arrayOf(z.string().min(1).max(60), 20),
  categoryIds: arrayOf(z.string().min(1).max(60), 10),
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  willingToTravel: z.boolean().default(false),
  travelCoverage: trimmed(50).optional().or(z.literal("")),
  operatingDays: arrayOf(z.string().min(1).max(20), 7),
  responseTime: trimmed(50).optional().or(z.literal("")),
});
export type StepProfessionalInput = z.infer<typeof stepProfessionalSchema>;

export const portfolioItemSchema = z.object({
  url: z.string().trim().url("Invalid image URL").max(500),
  publicId: z.string().trim().min(1).max(200),
  alt: z.string().trim().max(140).optional().or(z.literal("")),
});
export const stepPortfolioSchema = z.object({
  portfolio: arrayOf(portfolioItemSchema, 12).min(1, "Upload at least one portfolio image"),
});
export type StepPortfolioInput = z.infer<typeof stepPortfolioSchema>;

export const serviceItemSchema = z.object({
  name: trimmed(255).pipe(z.string().min(2, "Service name is too short")),
  description: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
  duration: trimmed(50).optional().or(z.literal("")),
  price: z.number().nonnegative("Price cannot be negative").max(100000),
  popular: z.boolean().default(false),
});
export const stepServicesSchema = z.object({
  services: arrayOf(serviceItemSchema, 25).min(1, "Add at least one service"),
  price: z.number().nonnegative().max(100000),
});
export type StepServicesInput = z.infer<typeof stepServicesSchema>;

export const stepReviewSchema = z.object({
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "You must accept the terms to submit"),
  acceptVerification: z
    .boolean()
    .refine((v) => v === true, "You must consent to identity verification"),
});
export type StepReviewInput = z.infer<typeof stepReviewSchema>;

export const uploadSignSchema = z.object({
  /**
   * Client-supplied sub-namespace within the user's artist folder.
   * Server always rewrites to `leish/users/{userId}/artist/{stripped}` —
   * client input here is advisory only. We accept the convention
   * `leish/<sub>` (which the server will strip) OR a bare `<sub>` and
   * prepend the prefix server-side. The server is the source of truth.
   */
  folder: z
    .string()
    .trim()
    .min(1, "Folder is required")
    .max(120)
    .regex(/^[a-z0-9_\-/]+$/i, "Folder may only contain letters, numbers, _, -, /"),
  publicIdPrefix: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_\-]{1,40}$/, "Invalid publicId prefix")
    .max(40)
    .optional(),
  resourceType: z.enum(["image", "video"]).default("image"),
  /**
   * Optional client-requested cap, in bytes. Server enforces a hard ceiling.
   * The signed `max_file_size` parameter is what Cloudinary ultimately enforces.
   */
  maxBytes: z
    .number()
    .int()
    .positive()
    .max(60 * 1024 * 1024)
    .optional(),
});
export type UploadSignInput = z.infer<typeof uploadSignSchema>;
