import { db } from "@/db";
import { users, profiles, bookings, categories as categoriesTable, testimonials } from "@/db/schema";
import { count, avg, sql, eq, desc, inArray, and } from "drizzle-orm";
import { HeroSection } from "@/components/home/HeroSection";
import { RoleRedirect } from "@/components/home/RoleRedirect";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FeaturedArtistsSection } from "@/components/home/FeaturedArtistsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CtaSection } from "@/components/home/CtaSection";

async function getCategoryCounts() {
  try {
    const rows = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        icon: categoriesTable.icon,
        image: categoriesTable.image,
      })
      .from(categoriesTable)
      .orderBy(categoriesTable.name);
    const counts = await Promise.all(
      rows.map((c) =>
        db
          .select({ count: count() })
          .from(profiles)
          .where(and(eq(profiles.role, "artist"), sql`${profiles.categories} @> ARRAY[${c.slug}]::text[]`))
          .then((r) => Number(r[0]?.count || 0)),
      ),
    );
    return rows.map((r, i) => ({ ...r, artistCount: counts[i] }));
  } catch {
    console.error("Failed to load category counts");
    return [];
  }
}

async function getRealTestimonials() {
  try {
    const rows = await db
      .select({ quote: testimonials.quote, author: testimonials.author, role: testimonials.role, rating: testimonials.rating })
      .from(testimonials)
      .orderBy(desc(testimonials.createdAt))
      .limit(4);
    return rows.length > 0 ? rows : null;
  } catch {
    console.error("Failed to load testimonials");
    return null;
  }
}

async function getStats() {
  try {
    const [userCount, artistStats, bookingCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({
        count: count(),
        avgRating: avg(sql`CAST(${profiles.rating} AS DECIMAL)`),
      }).from(profiles).where(eq(profiles.role, "artist")),
      db.select({ count: count() }).from(bookings),
    ]);
    const artistCount = artistStats[0]?.count || 0;
    const avgRating = artistStats[0]?.avgRating
      ? Number(Number(artistStats[0].avgRating).toFixed(1))
      : 0;
    return [
      { value: `${userCount[0]?.count || 0}+`.replace("0+", "0"), label: "Happy Clients" },
      { value: avgRating > 0 ? avgRating.toString() : "0", label: "Avg Rating" },
      { value: `${artistCount}+`.replace("0+", "0"), label: "Pro Artists" },
      { value: `${bookingCount[0]?.count || 0}+`.replace("0+", "0"), label: "Bookings" },
    ];
  } catch {
    console.error("Failed to load homepage stats");
    return undefined;
  }
}

async function getFeaturedStats() {
  try {
    const [onboardingCount, catCount] = await Promise.all([
      db
        .select({ count: count() })
        .from(profiles)
        .where(inArray(profiles.status, ["draft", "pending_verification"])),
      db.select({ count: count() }).from(categoriesTable),
    ]);
    return {
      onboardingArtists: onboardingCount[0]?.count || 0,
      categoryCount: catCount[0]?.count || 0,
    };
  } catch {
    console.error("Failed to load featured section stats");
    return { onboardingArtists: 0, categoryCount: 0 };
  }
}

export default async function HomePage() {
  const [stats, categoryCounts, realTestimonials, featuredStats] = await Promise.all([
    getStats(),
    getCategoryCounts(),
    getRealTestimonials(),
    getFeaturedStats(),
  ]);
  return (
    <>
      <RoleRedirect />
      <HeroSection stats={stats} />
      <CategoriesSection categories={categoryCounts} />
      <FeaturedArtistsSection
        onboardingArtists={Number(featuredStats.onboardingArtists)}
        categoryCount={Number(featuredStats.categoryCount)}
      />
      <HowItWorksSection />
      <TestimonialsSection testimonials={realTestimonials} />
      <CtaSection />
    </>
  );
}
