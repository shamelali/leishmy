-- Real Billplz V5 Payment Order payouts + SWIFT bank code capture.
-- Idempotent: safe to re-run where columns already exist.
--
-- profiles.bank_code         : SWIFT code (e.g. MBBEMYKL) for Payment Orders
-- payouts.payout_order_id    : Billplz Payment Order id for the disbursement
-- payouts.billplz_payout_status : Billplz lifecycle (processing/enquiring/.../completed)
-- payouts.dispatched_amount  : net amount actually disbursed (in cents)
-- payouts.dispatched_at      : when the Payment Order was created

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "bank_code" varchar(20);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "payout_order_id" varchar(255);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "billplz_payout_status" varchar(50);
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "dispatched_amount" integer;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "dispatched_at" timestamp;