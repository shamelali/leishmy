-- Add place_id column to bookings table
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "place_id" varchar(255);
