-- Add accommodation_fee column to profiles table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "accommodation_fee" decimal(10,2) DEFAULT '0';

-- Add accommodation_fee column to bookings table
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "accommodation_fee" decimal(10,2) DEFAULT '0';
