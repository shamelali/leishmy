-- Add missing indexes for query performance
-- Bookings
CREATE INDEX IF NOT EXISTS "bookings_user_id_idx" ON "bookings" ("user_id");
CREATE INDEX IF NOT EXISTS "bookings_artist_id_idx" ON "bookings" ("artist_id");
CREATE INDEX IF NOT EXISTS "bookings_date_idx" ON "bookings" ("date");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" ("status");
CREATE INDEX IF NOT EXISTS "bookings_user_status_idx" ON "bookings" ("user_id","status");

-- Payments
CREATE INDEX IF NOT EXISTS "payments_booking_id_idx" ON "payments" ("booking_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");

-- Reviews
CREATE INDEX IF NOT EXISTS "reviews_artist_id_idx" ON "reviews" ("artist_id");
CREATE INDEX IF NOT EXISTS "reviews_studio_id_idx" ON "reviews" ("studio_id");

-- Services
CREATE INDEX IF NOT EXISTS "services_artist_id_idx" ON "services" ("artist_id");
CREATE INDEX IF NOT EXISTS "services_studio_id_idx" ON "services" ("studio_id");
