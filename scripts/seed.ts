import "dotenv/config";
import { db } from "../src/db";
import {
  categories,
  artists,
  testimonials,
  artistCategories,
} from "../src/db/schema";
import { featuredArtists, categories as mockCategories, testimonials as mockTestimonials } from "../src/lib/data";

async function seed() {
  console.log("Seeding database...");

  // Seed categories
  for (const cat of mockCategories) {
    await db.insert(categories).values({
      name: cat.name,
      slug: cat.id,
      description: `${cat.name} makeup category`,
      icon: cat.icon,
      image: cat.image,
    }).onConflictDoNothing({ target: categories.slug });
  }
  console.log(`  ${mockCategories.length} categories seeded`);

  // Seed artists
  for (const a of featuredArtists) {
    try {
      await db.insert(artists).values({
        name: a.name,
        slug: a.slug,
        image: a.image,
        location: a.location,
        rating: String(a.rating),
        reviewCount: a.reviewCount,
        bio: a.bio,
        price: String(a.price),
        verified: a.verified,
        responseTime: a.responseTime,
        languages: a.languages,
        portfolio: a.portfolio.length > 0 ? a.portfolio : null,
      });
    } catch (e: any) {
      if (!e.message?.includes("duplicate")) console.error("  artist insert failed:", a.slug, e.message);
    }
  }
  console.log(`  ${featuredArtists.length} artists seeded`);

  // Seed artist_categories linking table
  const catRows = await db.select().from(categories);
  const catBySlug = new Map(catRows.map((c) => [c.slug, c.id]));
  const artistRows = await db.select().from(artists);
  const artistBySlug = new Map(artistRows.map((a) => [a.slug, a.id]));
  let linkCount = 0;
  for (const mock of featuredArtists) {
    const artistId = artistBySlug.get(mock.slug);
    if (!artistId) continue;
    for (const catSlug of mock.categories) {
      const categoryId = catBySlug.get(catSlug);
      if (!categoryId) continue;
      try {
        await db.insert(artistCategories).values({ artistId, categoryId }).onConflictDoNothing();
        linkCount++;
      } catch { /* ignore duplicates */ }
    }
  }
  console.log(`  ${linkCount} artist-category links seeded`);

  console.log("  0 studios seeded (no seed data)");

  // Seed testimonials
  for (const t of mockTestimonials) {
    await db.insert(testimonials).values({
      quote: t.quote,
      author: t.author,
      role: t.role,
      rating: t.rating,
    });
  }
  console.log(`  ${mockTestimonials.length} testimonials seeded`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
