-- Migration: Add artist onboarding state fields
-- Tracks wizard progress and verification status.

ALTER TABLE "artists"
  ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "status" varchar(32) DEFAULT 'draft' NOT NULL,
  ADD COLUMN IF NOT EXISTS "rejection_reason" text;

-- Enforce allowed values at the application layer (Drizzle).
-- A check constraint is added so DB-level inserts also stay clean.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artists_status_check'
  ) THEN
    ALTER TABLE "artists"
      ADD CONSTRAINT "artists_status_check"
      CHECK ("status" IN ('draft', 'pending_verification', 'verified', 'rejected', 'suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "artists_status_idx" ON "artists" ("status");
CREATE INDEX IF NOT EXISTS "artists_user_id_idx" ON "artists" ("user_id");
