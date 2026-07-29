DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'depositAmount')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_amount') THEN
    ALTER TABLE "bookings" RENAME COLUMN "depositAmount" TO deposit_amount;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'secondPaymentDueDate')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'second_payment_due_date') THEN
    ALTER TABLE "bookings" RENAME COLUMN "secondPaymentDueDate" TO second_payment_due_date;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'lateFeeCharged')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'late_fee_charged') THEN
    ALTER TABLE "bookings" RENAME COLUMN "lateFeeCharged" TO late_fee_charged;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'noShow')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'no_show') THEN
    ALTER TABLE "bookings" RENAME COLUMN "noShow" TO no_show;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'travelSurcharge')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'travel_surcharge') THEN
    ALTER TABLE "bookings" RENAME COLUMN "travelSurcharge" TO travel_surcharge;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'remainingPaymentSent')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'remaining_payment_sent') THEN
    ALTER TABLE "bookings" RENAME COLUMN "remainingPaymentSent" TO remaining_payment_sent;
  END IF;
END $$;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deposit_amount" numeric(10, 2);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "milestone" varchar(50);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "second_payment_due_date" timestamp;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "late_fee_charged" boolean DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "no_show" boolean DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "travel_surcharge" numeric(10, 2) DEFAULT '0';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "remaining_payment_sent" boolean DEFAULT false;
