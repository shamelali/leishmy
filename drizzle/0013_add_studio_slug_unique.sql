-- Add unique constraint on studios.slug to support conflict-safe seeding and detail lookups
ALTER TABLE "studios" ADD CONSTRAINT "studios_slug_unique" UNIQUE ("slug");
