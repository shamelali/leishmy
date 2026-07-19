-- Collapse artists/studios into a single `profiles` table keyed by user_id.
-- Safety verified on branch: all dependents (bookings, favorites, reviews,
-- services, availability_slots, inquiries, saved_inspiration, studio_inventory,
-- payouts, referrals, studio_categories, mua_bank_accounts) are EMPTY.
-- Only `artists` (1), `studios` (1, orphan NULL user_id), `artist_categories` (3) hold data.
--
-- RLS note: several policies reference the dropped tables, so they must be
-- dropped first and the affected ones recreated against `profiles`.

BEGIN;

-- 0. Drop RLS policies that reference artists/studios/mua_bank_accounts.
DROP POLICY IF EXISTS "read_artists" ON "artists";
DROP POLICY IF EXISTS "manage_own_artist" ON "artists";
DROP POLICY IF EXISTS "read_studios" ON "studios";
DROP POLICY IF EXISTS "manage_own_studio" ON "studios";
DROP POLICY IF EXISTS "manage_own_artist_categories" ON "artist_categories";
DROP POLICY IF EXISTS "manage_own_studio_categories" ON "studio_categories";
DROP POLICY IF EXISTS "manage_own_services" ON "services";
DROP POLICY IF EXISTS "read_services" ON "services";
DROP POLICY IF EXISTS "manage_own_studio_inventory" ON "studio_inventory";
DROP POLICY IF EXISTS "manage_own_bank_accounts" ON "mua_bank_accounts";
DROP POLICY IF EXISTS "manage_own_mua_bank_accounts" ON "mua_bank_accounts";

-- Drop every FK that points at the legacy tables (names vary by how they were created).
ALTER TABLE "artists" DROP CONSTRAINT IF EXISTS "artists_studio_id_fkey";
ALTER TABLE "studio_categories" DROP CONSTRAINT IF EXISTS "studio_categories_studio_id_studios_id_fk";
ALTER TABLE "studio_inventory" DROP CONSTRAINT IF EXISTS "studio_inventory_studio_id_studios_id_fk";
ALTER TABLE "studio_inventory" DROP CONSTRAINT IF EXISTS "studio_inventory_studio_id_fkey";

-- 1. Profiles table (target shape).
CREATE TABLE IF NOT EXISTS "profiles" (
  "user_id" text PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
  "role" text NOT NULL DEFAULT 'customer',
  "status" varchar(32) NOT NULL DEFAULT 'draft',
  "verified" boolean DEFAULT false,
  "available" boolean DEFAULT true,
  "slug" varchar(255),
  "bio" text,
  "portfolio" text[],
  "specialties" jsonb DEFAULT '[]'::jsonb,
  "languages" text[],
  "certifications" text,
  "availability" text,
  "instagram_url" varchar(500),
  "tiktok_url" varchar(500),
  "willing_to_travel" boolean DEFAULT false,
  "travel_coverage" varchar(50),
  "operating_days" jsonb DEFAULT '[]'::jsonb,
  "experience" integer DEFAULT 0,
  "response_time" varchar(50),
  "price" decimal(10,2) DEFAULT '0',
  "rating" decimal(3,2) DEFAULT '0',
  "review_count" integer DEFAULT 0,
  "area" varchar(100),
  "district" varchar(100),
  "featured" boolean DEFAULT false,
  "bank_name" varchar(255),
  "account_number" varchar(100),
  "account_holder" varchar(255),
  "onboarding_step" integer NOT NULL DEFAULT 0,
  "rejection_reason" text,
  "studio_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_slug_idx" ON "profiles"("slug");
CREATE INDEX IF NOT EXISTS "profiles_role_idx" ON "profiles"("role");
CREATE INDEX IF NOT EXISTS "profiles_status_idx" ON "profiles"("status");
CREATE INDEX IF NOT EXISTS "profiles_user_id_idx" ON "profiles"("user_id");

-- 2. Backfill artists -> profiles (Amiera, user_id present).
INSERT INTO "profiles" (
  "user_id","role","status","verified","available","slug","bio","portfolio",
  "specialties","languages","certifications","availability","instagram_url","tiktok_url",
  "willing_to_travel","travel_coverage","operating_days","experience","response_time",
  "price","rating","review_count","area","district","featured","onboarding_step"
)
SELECT
  a."user_id",'artist',a."status",a."verified",a."available",a."slug",a."bio",a."portfolio",
  COALESCE(a."specialties",'[]'::jsonb),a."languages",a."certifications",a."availability",
  a."instagram_url",a."tiktok_url",a."willing_to_travel",a."travel_coverage",
  COALESCE(a."operating_days",'[]'::jsonb),a."experience",a."response_time",
  a."price",a."rating",a."review_count",a."area",a."district",false,a."onboarding_step"
FROM "artists" a
WHERE a."user_id" IS NOT NULL
ON CONFLICT ("user_id") DO NOTHING;

-- 3. Backfill studios -> profiles. Orphan studio (NULL user_id) gets a
-- synthetic user so the one-person-one-row invariant holds.
DO $$
DECLARE
  v_uid text;
  v_studio record;
BEGIN
  FOR v_studio IN SELECT * FROM "studios" WHERE "user_id" IS NULL LOOP
    v_uid := gen_random_uuid()::text;
    INSERT INTO "user" ("id","name","email","role","created_at","updated_at")
    VALUES (v_uid, v_studio."name", v_studio."email", 'studio', now(), now());
    INSERT INTO "profiles" (
      "user_id","role","status","verified","available","slug","bio","price",
      "rating","review_count","area","featured","onboarding_step"
    ) VALUES (
      v_uid,'studio','verified',true,true,v_studio."slug",'',v_studio."price",
      v_studio."rating",v_studio."review_count",v_studio."area",v_studio."featured",5
    )
    ON CONFLICT ("user_id") DO NOTHING;
  END LOOP;
END $$;

INSERT INTO "profiles" (
  "user_id","role","status","verified","available","slug","bio","price",
  "rating","review_count","area","featured","onboarding_step"
)
SELECT
  s."user_id",'studio','verified',true,true,s."slug",'',s."price",
  s."rating",s."review_count",s."area",s."featured",5
FROM "studios" s
WHERE s."user_id" IS NOT NULL
ON CONFLICT ("user_id") DO NOTHING;

-- 4. Repoint dependents' integer FKs to text user_id. All dependents are
-- empty, so we just swap column types.
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_artist_id_artists_id_fk";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_studio_id_studios_id_fk";
ALTER TABLE "bookings" ALTER COLUMN "artist_id" TYPE text USING "artist_id"::text;
ALTER TABLE "bookings" ALTER COLUMN "studio_id" TYPE text USING "studio_id"::text;
ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_artist_id_artists_id_fk";
ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_studio_id_studios_id_fk";
ALTER TABLE "services" ALTER COLUMN "artist_id" TYPE text USING "artist_id"::text;
ALTER TABLE "services" ALTER COLUMN "studio_id" TYPE text USING "studio_id"::text;
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_artist_id_artists_id_fk";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_studio_id_studios_id_fk";
ALTER TABLE "reviews" ALTER COLUMN "artist_id" TYPE text USING "artist_id"::text;
ALTER TABLE "reviews" ALTER COLUMN "studio_id" TYPE text USING "studio_id"::text;
ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_artist_id_artists_id_fk";
ALTER TABLE "favorites" ALTER COLUMN "artist_id" TYPE text USING "artist_id"::text;
ALTER TABLE "availability_slots" DROP CONSTRAINT IF EXISTS "availability_slots_artist_id_artists_id_fk";
ALTER TABLE "availability_slots" DROP CONSTRAINT IF EXISTS "availability_slots_studio_id_studios_id_fk";
ALTER TABLE "availability_slots" ALTER COLUMN "artist_id" TYPE text USING "artist_id"::text;
ALTER TABLE "availability_slots" ALTER COLUMN "studio_id" TYPE text USING "studio_id"::text;
ALTER TABLE "inquiries" DROP CONSTRAINT IF EXISTS "inquiries_artist_id_artists_id_fk";
ALTER TABLE "inquiries" DROP CONSTRAINT IF EXISTS "inquiries_artist_id_fkey";
ALTER TABLE "inquiries" ALTER COLUMN "artist_id" TYPE text USING "artist_id"::text;
ALTER TABLE "saved_inspiration" DROP CONSTRAINT IF EXISTS "saved_inspiration_source_artist_id_artists_id_fk";
ALTER TABLE "saved_inspiration" DROP CONSTRAINT IF EXISTS "saved_inspiration_source_artist_id_fkey";
ALTER TABLE "saved_inspiration" ALTER COLUMN "source_artist_id" TYPE text USING "source_artist_id"::text;
ALTER TABLE "studio_inventory" DROP CONSTRAINT IF EXISTS "studio_inventory_studio_id_studios_id_fk";
ALTER TABLE "studio_inventory" ALTER COLUMN "studio_id" TYPE text USING "studio_id"::text;
ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS "payouts_bank_account_id_mua_bank_accounts_id_fk";
ALTER TABLE "payouts" DROP COLUMN IF EXISTS "bank_account_id";
ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "referrals_referrer_id_artists_id_fk";
ALTER TABLE "referrals" RENAME COLUMN "referrer_id" TO "referrer_user_id";
ALTER TABLE "referrals" ALTER COLUMN "referrer_user_id" TYPE text USING "referrer_user_id"::text;

-- 5b. Carry studio description + artist category mapping into profiles
-- BEFORE the source tables are dropped (section 6).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "categories" text[];

UPDATE "profiles" p
SET "description" = s."description"
FROM "studios" s
WHERE p."user_id" = s."user_id" AND s."description" IS NOT NULL;

UPDATE "profiles" p
SET "categories" = (
  SELECT array_agg(c."name")
  FROM "artist_categories" ac
  JOIN "categories" c ON c."id" = ac."category_id"
  WHERE ac."artist_id" = (
    SELECT a."id" FROM "artists" a WHERE a."user_id" = p."user_id" LIMIT 1
  )
)
WHERE p."role" = 'artist';

-- 5. Re-add FKs against users.id (text).
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_studio_id_users_id_fk" FOREIGN KEY ("studio_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_studio_id_users_id_fk" FOREIGN KEY ("studio_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_studio_id_users_id_fk" FOREIGN KEY ("studio_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_studio_id_users_id_fk" FOREIGN KEY ("studio_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "saved_inspiration" ADD CONSTRAINT "saved_inspiration_source_artist_id_users_id_fk" FOREIGN KEY ("source_artist_id") REFERENCES "user"("id") ON DELETE SET NULL;
ALTER TABLE "studio_inventory" ADD CONSTRAINT "studio_inventory_studio_id_users_id_fk" FOREIGN KEY ("studio_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- 6. Drop the now-empty legacy tables.
DROP TABLE IF EXISTS "artist_categories" CASCADE;
DROP TABLE IF EXISTS "studio_categories" CASCADE;
DROP TABLE IF EXISTS "mua_bank_accounts" CASCADE;
DROP TABLE IF EXISTS "artists" CASCADE;
DROP TABLE IF EXISTS "studios" CASCADE;

-- 7. Recreate RLS policies against `profiles` where needed.
CREATE POLICY "read_profiles" ON "profiles" FOR SELECT USING (true);
CREATE POLICY "manage_own_profile" ON "profiles" FOR ALL USING (auth.user_id() = "user_id") WITH CHECK (auth.user_id() = "user_id");

CREATE POLICY "read_services" ON "services" FOR SELECT USING (true);
CREATE POLICY "manage_own_services" ON "services" FOR ALL USING (
  ("artist_id" IS NOT NULL AND EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."user_id" = "services"."artist_id" AND "profiles"."user_id" = auth.user_id()))
  OR ("studio_id" IS NOT NULL AND EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."user_id" = "services"."studio_id" AND "profiles"."user_id" = auth.user_id()))
) WITH CHECK (
  ("artist_id" IS NOT NULL AND EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."user_id" = "services"."artist_id" AND "profiles"."user_id" = auth.user_id()))
  OR ("studio_id" IS NOT NULL AND EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."user_id" = "services"."studio_id" AND "profiles"."user_id" = auth.user_id()))
);

CREATE POLICY "manage_own_studio_inventory" ON "studio_inventory" FOR ALL USING (
  EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."user_id" = "studio_inventory"."studio_id" AND "profiles"."user_id" = auth.user_id() AND "profiles"."role" = 'studio')
) WITH CHECK (
  EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."user_id" = "studio_inventory"."studio_id" AND "profiles"."user_id" = auth.user_id() AND "profiles"."role" = 'studio')
);

COMMIT;
