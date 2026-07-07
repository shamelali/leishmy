const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "artists",
  "dashboard",
  "login",
  "register",
  "onboarding",
  "profile",
  "bookings",
  "search",
  "settings",
  "support",
  "studio",
  "studios",
]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function safeSlug(input: string, fallback = "artist"): string {
  const base = slugify(input) || fallback;
  if (RESERVED_SLUGS.has(base)) {
    return `${base}-${fallback}`;
  }
  return base;
}

export function withSuffix(base: string, attempt: number): string {
  return `${base}-${attempt + 1}`;
}
