import type { MetadataRoute } from "next";
import { db } from "@/db";
import { bookings, profiles, services, categories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://leish.my";

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/artists`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/studios`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
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

    const activeServices = await db
      .select({ slug: services.name, id: services.id })
      .from(services)
      .limit(50);

    for (const service of activeServices) {
      dynamicRoutes.push({
        url: `${baseUrl}/services/${service.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }

    const activeCategories = await db
      .select({ slug: categories.slug })
      .from(categories)
      .limit(20);

    for (const cat of activeCategories) {
      dynamicRoutes.push({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  } catch {
    // DB unavailable during build — return static routes only
  }

  return [...staticRoutes, ...dynamicRoutes];
}
