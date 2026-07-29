-- Custom SQL migration file, put your code below! --
CREATE TABLE IF NOT EXISTS "urls" (
    "id" serial PRIMARY KEY NOT NULL,
    "code" varchar(20) UNIQUE NOT NULL,
    "url" text NOT NULL,
    "custom" boolean DEFAULT false NOT NULL,
    "clicks" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "urls_code_idx" ON "urls" USING btree ("code");
CREATE INDEX IF NOT EXISTS "urls_created_idx" ON "urls" USING btree ("created_at");

CREATE TABLE IF NOT EXISTS "url_analytics" (
    "id" serial PRIMARY KEY NOT NULL,
    "code" varchar(20) NOT NULL,
    "referer" text,
    "user_agent" text,
    "country" varchar(100),
    "timestamp" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "url_analytics_code_idx" ON "url_analytics" USING btree ("code");
CREATE INDEX IF NOT EXISTS "url_analytics_timestamp_idx" ON "url_analytics" USING btree ("timestamp");
