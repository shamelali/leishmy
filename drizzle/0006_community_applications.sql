-- Migration: Create community_applications table
-- Stores applications to join the MUA community network.

CREATE TABLE IF NOT EXISTS "community_applications" (
  "id" serial PRIMARY KEY,
  "first_name" varchar(255) NOT NULL,
  "last_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(50) NOT NULL,
  "city" varchar(255) NOT NULL,
  "state" varchar(255) NOT NULL,
  "years_of_experience" text NOT NULL,
  "expertise_areas" jsonb NOT NULL,
  "portfolio_image_url" text,
  "portfolio_links" text,
  "certifications" text,
  "social_profiles" text,
  "availability" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "community_applications_email_idx" ON "community_applications" ("email");
CREATE INDEX IF NOT EXISTS "community_applications_created_at_idx" ON "community_applications" ("created_at");
