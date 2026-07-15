CREATE TABLE IF NOT EXISTS "referrals" (
  "id" serial PRIMARY KEY NOT NULL,
  "referrer_type" varchar(50) NOT NULL,
  "referrer_id" integer NOT NULL,
  "referred_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "referred_email" text,
  "status" varchar(50) NOT NULL DEFAULT 'clicked',
  "booking_id" integer REFERENCES "bookings"("id") ON DELETE SET NULL,
  "points_awarded" integer DEFAULT 0,
  "clicked_at" timestamp DEFAULT now() NOT NULL,
  "registered_at" timestamp,
  "booked_at" timestamp,
  "rewarded_at" timestamp
);

CREATE INDEX IF NOT EXISTS "referrals_referrer_idx" ON "referrals" ("referrer_type", "referrer_id");
CREATE INDEX IF NOT EXISTS "referrals_status_idx" ON "referrals" ("status");
CREATE INDEX IF NOT EXISTS "referrals_referred_user_idx" ON "referrals" ("referred_user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "referrals_unique_email_per_referrer"
ON "referrals" ("referrer_type", "referrer_id", "referred_email")
WHERE "referred_email" IS NOT NULL;
