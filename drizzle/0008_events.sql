CREATE TABLE IF NOT EXISTS "events" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "date" timestamp NOT NULL,
  "time" varchar(50),
  "location" varchar(255),
  "category" varchar(100),
  "image" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
