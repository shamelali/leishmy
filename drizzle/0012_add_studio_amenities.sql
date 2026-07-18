-- Add amenities array to studios for real studio profile data
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "amenities" text[] DEFAULT '{}';
