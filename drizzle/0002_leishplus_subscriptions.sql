-- Migration: Leish+ Subscription System
-- Adds subscription_plans, subscriptions tables and seeds default plan data

CREATE TABLE IF NOT EXISTS "subscription_plans" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "description" text,
  "price" integer NOT NULL,
  "currency" varchar(10) DEFAULT 'MYR',
  "duration_days" integer NOT NULL DEFAULT 30,
  "features" jsonb DEFAULT '[]',
  "popular" boolean DEFAULT false,
  "active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "subscription_plans_slug_unique" UNIQUE("slug")
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "plan_id" integer NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "billplz_bill_id" varchar(255),
  "cancelled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" ("status");

--> statement-breakpoint

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint

-- Seed Leish+ subscription plan
INSERT INTO "subscription_plans" ("name", "slug", "description", "price", "duration_days", "features", "popular") VALUES
  ('Leish+ Monthly', 'leish-plus-monthly', 'Priority booking, exclusive discounts, free rescheduling, AI beauty consultations, faster support, and birthday perks.', 1900, 30, '["Priority booking", "Exclusive discounts on all services", "Free rescheduling (unlimited)", "AI beauty consultations", "Faster customer support (priority queue)", "Birthday perks and rewards"]', true)
ON CONFLICT ("slug") DO NOTHING;
