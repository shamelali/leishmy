export const EMAIL_ALIASES = {
  support: "SUPPORT_EMAIL",
  billing: "BILLING_EMAIL",
  marketing: "MARKETING_EMAIL",
  admin: "ADMIN_EMAIL",
  notifications: "NOTIFICATIONS_EMAIL",
  info: "INFO_EMAIL",
  studio: "STUDIO_EMAIL",
  artist: "ARTIST_EMAIL",
} as const;

export function getEmailAlias(key: keyof typeof EMAIL_ALIASES): string {
  return process.env[EMAIL_ALIASES[key]] || `${key}@leish.my`;
}

export const MIN_BOOKING_AMOUNT = Number(process.env.NEXT_PUBLIC_MIN_BOOKING_AMOUNT ?? 50);
export const MAX_BOOKING_AMOUNT = Number(process.env.NEXT_PUBLIC_MAX_BOOKING_AMOUNT ?? 50_000);

