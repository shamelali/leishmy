-- Migration: Add certifications and availability columns to artists
-- Captures free-text professional credentials and working-hours notes
-- surfaced through the artist dashboard edit form.

ALTER TABLE "artists"
  ADD COLUMN IF NOT EXISTS "certifications" text,
  ADD COLUMN IF NOT EXISTS "availability" text;
