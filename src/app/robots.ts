import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/profile/", "/favorites/"],
    },
    sitemap: "https://leishmy.vercel.app/sitemap.xml",
  };
}
