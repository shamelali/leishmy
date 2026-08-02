-- Placeholder: migration was previously applied to the database
-- Original SQL file was lost; this placeholder prevents drizzle-kit from re-applying
CREATE UNIQUE INDEX IF NOT EXISTS "studios_slug_unique_idx" ON "studios" USING btree ("slug");
