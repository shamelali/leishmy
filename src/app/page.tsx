import { db } from "@/db";
import { users, artists, bookings, reviews } from "@/db/schema";
import { count, avg, sql } from "drizzle-orm";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FeaturedArtistsSection } from "@/components/home/FeaturedArtistsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CtaSection } from "@/components/home/CtaSection";

async function getStats() {
  try {
    const [userCount, artistCount, bookingCount, ratingResult] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(artists),
      db.select({ count: count() }).from(bookings),
      db.select({ avg: avg(sql`CAST(${artists.rating} AS DECIMAL)`) }).from(artists),
    ]);
    const avgRating = ratingResult[0]?.avg ? Number(Number(ratingResult[0].avg).toFixed(1)) : 0;
    return [
      { value: `${userCount[0]?.count || 0}+`.replace("0+", "0"), label: "Happy Clients" },
      { value: avgRating > 0 ? avgRating.toString() : "0", label: "Avg Rating" },
      { value: `${artistCount[0]?.count || 0}+`.replace("0+", "0"), label: "Pro Artists" },
      { value: `${bookingCount[0]?.count || 0}+`.replace("0+", "0"), label: "Bookings" },
    ];
  } catch {
    return undefined;
  }
}

export default async function HomePage() {
  const stats = await getStats();
  return (
    <>
      <HeroSection stats={stats} />
      <CategoriesSection />
      <FeaturedArtistsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
