import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_URL: z.string().min(1, "NEXT_PUBLIC_URL is required"),
  BREVO_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  FROM_NAME: z.string().optional(),
  BILLPLZ_API_KEY: z.string().optional(),
  BILLPLZ_COLLECTION_ID: z.string().optional(),
  BILLPLZ_SIGNATURE_KEY: z.string().optional(),
  BILLPLZ_API_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_FB_PIXEL_ID: z.string().optional(),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  NEON_AUTH_BASE_URL: z.string().min(1, "NEON_AUTH_BASE_URL is required"),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32, "NEON_AUTH_COOKIE_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_NEON_AUTH_BASE_URL: z.string().optional(),
  NEON_AUTH_URL: z.string().optional().describe(
    "Neon Auth database connection string used by the sync-auth-users cron to read neon_auth.* tables. " +
      "Only required when the sync-auth-users cron is enabled; omitting it makes the cron fail-fast at runtime if invoked.",
  ),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues
    .filter((i) => i.code === "too_small" && i.minimum === 1)
    .map((i) => i.path.join("."));
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

if (parsed.success && parsed.data.NODE_ENV === "production") {
  const requiredInProduction = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    "BILLPLZ_API_KEY",
    "BILLPLZ_COLLECTION_ID",
    "BILLPLZ_API_URL",
  ] as const;
  const missing = requiredInProduction.filter(
    (k) => !parsed.data[k as keyof typeof parsed.data],
  );
  if (missing.length > 0) {
    console.warn(
      `[env] Missing required production env vars: ${missing.join(", ")}. ` +
        "Related features will fail until these are set.",
    );
  }
}

export const env = parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>);
