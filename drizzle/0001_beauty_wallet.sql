-- Migration: Beauty Wallet tables
-- Adds skin_profiles, beauty_preferences, inspiration_boards, saved_inspiration, loyalty_tiers, loyalty_points, loyalty_transactions

CREATE TABLE IF NOT EXISTS "skin_profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "skin_type" varchar(50),
  "skin_concerns" jsonb DEFAULT '[]',
  "undertone" varchar(50),
  "allergies" jsonb DEFAULT '[]',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "skin_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skin_profiles_user_idx" ON "skin_profiles" ("user_id");
--> statement-breakpoint
ALTER TABLE "skin_profiles" ADD CONSTRAINT "skin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beauty_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "preferred_styles" jsonb DEFAULT '[]',
  "preferred_products" jsonb DEFAULT '[]',
  "makeup_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "beauty_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "beauty_preferences_user_idx" ON "beauty_preferences" ("user_id");
--> statement-breakpoint
ALTER TABLE "beauty_preferences" ADD CONSTRAINT "beauty_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inspiration_boards" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "cover_image" text,
  "is_public" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inspiration_boards_user_idx" ON "inspiration_boards" ("user_id");
--> statement-breakpoint
ALTER TABLE "inspiration_boards" ADD CONSTRAINT "inspiration_boards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_inspiration" (
  "id" serial PRIMARY KEY NOT NULL,
  "board_id" integer NOT NULL,
  "user_id" text NOT NULL,
  "image_url" text NOT NULL,
  "source_artist_id" integer,
  "source_type" varchar(50) DEFAULT 'user_upload',
  "caption" text,
  "tags" jsonb DEFAULT '[]',
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_inspiration_board_idx" ON "saved_inspiration" ("board_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_inspiration_user_idx" ON "saved_inspiration" ("user_id");
--> statement-breakpoint
ALTER TABLE "saved_inspiration" ADD CONSTRAINT "saved_inspiration_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."inspiration_boards"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_inspiration" ADD CONSTRAINT "saved_inspiration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "saved_inspiration" ADD CONSTRAINT "saved_inspiration_source_artist_id_fkey" FOREIGN KEY ("source_artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_tiers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(50) NOT NULL,
  "min_points" integer NOT NULL DEFAULT 0,
  "multiplier" numeric(3, 2) DEFAULT '1.00',
  "perks" jsonb DEFAULT '[]',
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "loyalty_tiers_name_unique" UNIQUE("name")
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_points" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "balance" integer NOT NULL DEFAULT 0,
  "lifetime_earned" integer NOT NULL DEFAULT 0,
  "lifetime_redeemed" integer NOT NULL DEFAULT 0,
  "tier" varchar(50) DEFAULT 'bronze',
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "loyalty_points_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_points_user_idx" ON "loyalty_points" ("user_id");
--> statement-breakpoint
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "amount" integer NOT NULL,
  "type" varchar(50) NOT NULL,
  "source" varchar(50) NOT NULL,
  "reference_id" varchar(255),
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_transactions_user_idx" ON "loyalty_transactions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "loyalty_transactions_created_idx" ON "loyalty_transactions" ("created_at");
--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
-- Seed default loyalty tiers
INSERT INTO "loyalty_tiers" ("name", "min_points", "multiplier", "perks") VALUES
  ('bronze', 0, '1.00', '["Welcome bonus on signup", "Birthday reward"]'),
  ('silver', 500, '1.25', '["1.25x points multiplier", "Welcome bonus on signup", "Birthday reward", "Priority booking"]'),
  ('gold', 2000, '1.50', '["1.50x points multiplier", "Welcome bonus on signup", "Birthday reward", "Priority booking", "Exclusive event access", "Free touch-up session"]'),
  ('platinum', 5000, '2.00', '["2.00x points multiplier", "Welcome bonus on signup", "Birthday reward", "Priority booking", "Exclusive event access", "Free touch-up session", "Dedicated concierge", "Early access to new artists"]')
ON CONFLICT ("name") DO NOTHING;
