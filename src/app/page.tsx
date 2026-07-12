import { db } from "@/db";
import { users, artists, bookings } from "@/db/schema";
import { count, avg, sql } from "drizzle-orm";
import { HeroSection } from "@/components/home/HeroSection";
import { RoleRedirect } from "@/components/home/RoleRedirect";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FeaturedArtistsSection } from "@/components/home/FeaturedArtistsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CtaSection } from "@/components/home/CtaSection";

async function getStats() {
  try {
    const [userCount, artistStats, bookingCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({
        count: count(),
        avgRating: avg(sql`CAST(${artists.rating} AS DECIMAL)`),
      }).from(artists),
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

export default async function HomePage() {
  const stats = await getStats();
  return (
    <>
      <RoleRedirect />
      <HeroSection stats={stats} />
      <CategoriesSection />
      <FeaturedArtistsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
