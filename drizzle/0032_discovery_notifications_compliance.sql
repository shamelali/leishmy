-- Deploy the roadmap tables already represented in src/db/schema.ts.
-- Every statement is idempotent so this is safe for environments where a
-- previous `db:push` created some or all of these tables.

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "endpoint" text NOT NULL,
  "p256dh" text DEFAULT '' NOT NULL,
  "auth_key" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "push_subscriptions_user_endpoint_unique" UNIQUE("user_id", "endpoint")
);
CREATE INDEX IF NOT EXISTS "push_sub_user_idx" ON "push_subscriptions" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "availability_rules" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "day_of_week" integer NOT NULL CHECK ("day_of_week" BETWEEN 0 AND 6),
  "start_time" varchar(5) NOT NULL,
  "end_time" varchar(5) NOT NULL,
  "slot_duration_minutes" integer DEFAULT 60 CHECK ("slot_duration_minutes" > 0),
  "active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "availability_rules_time_range" CHECK ("start_time" < "end_time")
);
CREATE INDEX IF NOT EXISTS "avail_rules_user_idx" ON "availability_rules" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "avail_rules_day_idx" ON "availability_rules" USING btree ("day_of_week");

CREATE TABLE IF NOT EXISTS "availability_overrides" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "date" timestamp NOT NULL,
  "unavailable" boolean DEFAULT false,
  "start_time" varchar(5),
  "end_time" varchar(5),
  "reason" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "avail_overrides_user_idx" ON "availability_overrides" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "avail_overrides_date_idx" ON "availability_overrides" USING btree ("date");

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE cascade,
  "email_enabled" boolean DEFAULT true,
  "push_enabled" boolean DEFAULT true,
  "whatsapp_enabled" boolean DEFAULT true,
  "booking_notifications" boolean DEFAULT true,
  "message_notifications" boolean DEFAULT true,
  "promo_notifications" boolean DEFAULT false,
  "quiet_hours_start" varchar(5),
  "quiet_hours_end" varchar(5),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "notif_prefs_user_idx" ON "notification_preferences" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "promo_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(50) NOT NULL UNIQUE,
  "type" varchar(20) NOT NULL CHECK ("type" IN ('percent', 'fixed')),
  "value" numeric(10,2) NOT NULL CHECK ("value" > 0),
  "min_amount" numeric(10,2) DEFAULT '0',
  "max_uses" integer,
  "used_count" integer DEFAULT 0,
  "valid_from" timestamp DEFAULT now() NOT NULL,
  "valid_until" timestamp,
  "active" boolean DEFAULT true,
  "created_by" text REFERENCES "user"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "promo_codes_code_idx" ON "promo_codes" USING btree ("code");
CREATE INDEX IF NOT EXISTS "promo_codes_active_idx" ON "promo_codes" USING btree ("active");

CREATE TABLE IF NOT EXISTS "promo_code_usages" (
  "id" serial PRIMARY KEY NOT NULL,
  "promo_code_id" integer NOT NULL REFERENCES "promo_codes"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "booking_id" integer REFERENCES "bookings"("id") ON DELETE set null,
  "discount_amount" numeric(10,2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "promo_usage_code_idx" ON "promo_code_usages" USING btree ("promo_code_id");
CREATE INDEX IF NOT EXISTS "promo_usage_user_idx" ON "promo_code_usages" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "excerpt" text,
  "content" text NOT NULL,
  "cover_image" text,
  "author_id" text REFERENCES "user"("id") ON DELETE set null,
  "tags" text[],
  "published" boolean DEFAULT false,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_published_idx" ON "blog_posts" USING btree ("published");

CREATE TABLE IF NOT EXISTS "data_export_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "status" varchar(50) DEFAULT 'pending',
  "requested_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  "download_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "data_export_user_idx" ON "data_export_requests" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "data_export_status_idx" ON "data_export_requests" USING btree ("status");

CREATE TABLE IF NOT EXISTS "consent_records" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "type" varchar(50) NOT NULL,
  "granted" boolean NOT NULL,
  "ip" varchar(45),
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "consent_user_idx" ON "consent_records" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "consent_type_idx" ON "consent_records" USING btree ("type");
