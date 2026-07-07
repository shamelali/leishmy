import "dotenv/config";
import { db } from "../src/db";
import {
  categories,
  testimonials,
} from "../src/db/schema";
import { categories as mockCategories, testimonials as mockTestimonials } from "../src/lib/data";

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

  console.log("  0 artists seeded (no seed data)");

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
