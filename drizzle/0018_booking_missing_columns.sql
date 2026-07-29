ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "travelSurcharge" numeric(10, 2) DEFAULT '0';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "lateFeeCharged" boolean DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "noShow" boolean DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "remainingPaymentSent" boolean DEFAULT false;