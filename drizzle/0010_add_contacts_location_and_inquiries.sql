ALTER TABLE "contacts" ADD COLUMN "location" text;

CREATE TABLE IF NOT EXISTS "inquiries" (
  "id" serial PRIMARY KEY NOT NULL,
  "artist_id" integer NOT NULL REFERENCES "artists"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(50),
  "location" text,
  "message" text NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "inquiries_artist_idx" ON "inquiries" ("artist_id");
CREATE INDEX IF NOT EXISTS "inquiries_status_idx" ON "inquiries" ("status");
