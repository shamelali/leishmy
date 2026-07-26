ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(255) UNIQUE;
