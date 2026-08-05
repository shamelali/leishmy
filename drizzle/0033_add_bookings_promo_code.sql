-- Add bookings.promo_code_id (FK to promo_codes) to support discount tracking.
-- Idempotent: safe to re-run on environments where the column already exists.

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "promo_code_id" integer REFERENCES "promo_codes"("id") ON DELETE SET NULL;
