-- Migration: Loyalty Rewards Update
-- Adds birthday column to users table, updates loyalty tiers to Silver/Gold/Platinum

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "birthday" varchar(10);

--> statement-breakpoint

-- Update loyalty tiers: rename/restructure to Silver, Gold, Platinum
-- Using upsert pattern since tiers may already exist
INSERT INTO "loyalty_tiers" ("name", "min_points", "multiplier", "perks") VALUES
  ('silver', 0, '1.00', '["RM1 = 1 point earning", "Birthday reward", "Referral bonus"]'),
  ('gold', 1000, '1.25', '["1.25x points multiplier", "RM1 = 1.25 point earning", "Birthday reward", "Referral bonus", "Priority booking", "Exclusive promotions"]'),
  ('platinum', 3000, '1.50', '["1.50x points multiplier", "RM1 = 1.50 point earning", "Birthday reward", "Referral bonus", "Priority booking", "Exclusive promotions", "Free touch-up session", "Early access to new artists"]')
ON CONFLICT ("name") DO UPDATE SET
  min_points = EXCLUDED.min_points,
  multiplier = EXCLUDED.multiplier,
  perks = EXCLUDED.perks;
