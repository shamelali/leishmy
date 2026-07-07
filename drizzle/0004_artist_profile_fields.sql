-- Migration: Add artist profile fields for Leish! Creative Network

ALTER TABLE "artists"
  ADD COLUMN IF NOT EXISTS "district" varchar(100),
  ADD COLUMN IF NOT EXISTS "instagram_url" varchar(500),
  ADD COLUMN IF NOT EXISTS "tiktok_url" varchar(500),
  ADD COLUMN IF NOT EXISTS "specialties" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "willing_to_travel" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "travel_coverage" varchar(50),
  ADD COLUMN IF NOT EXISTS "operating_days" jsonb DEFAULT '[]'::jsonb NOT NULL;
