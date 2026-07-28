ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paid_at" timestamp;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "released_at" timestamp;
