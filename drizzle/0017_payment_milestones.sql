ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "depositAmount" numeric(10, 2);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "milestone" varchar(50);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "secondPaymentDueDate" timestamp;