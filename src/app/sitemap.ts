import type { MetadataRoute } from "next";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { inArray } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://leish.my";

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/artists`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/studios`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/bookings`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/favorites`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const activeProfiles = await db
      .select({ slug: profiles.slug, role: profiles.role })
      .from(profiles)
      .where(inArray(profiles.status, ["active", "verified"]));

    for (const profile of activeProfiles) {
      dynamicRoutes.push({
        url: `${baseUrl}/${profile.role === "studio" ? "studios" : "artists"}/${profile.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }

  } catch {
    // DB unavailable during build — return static routes only
  }

  return [...staticRoutes, ...dynamicRoutes];
}
