-- Placeholder: migration was previously applied to the database
-- Original SQL file was lost; this placeholder prevents drizzle-kit from re-applying
ALTER TABLE studios ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';
