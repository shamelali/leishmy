-- Prevent double-booking the same artist (or unassigned studio slot) at the
-- same date + time. NULLS NOT DISTINCT treats missing time as a real value so
-- two "TBD" bookings on the same day still collide. Cancelled/rejected rows
-- are excluded so the slot can be rebooked.
--
-- Idempotent: safe to re-run.

CREATE UNIQUE INDEX IF NOT EXISTS bookings_artist_date_time_unique
  ON bookings (artist_id, date, time)
  NULLS NOT DISTINCT
  WHERE artist_id IS NOT NULL
    AND status NOT IN ('cancelled', 'rejected');

CREATE UNIQUE INDEX IF NOT EXISTS bookings_studio_date_time_unique
  ON bookings (studio_id, date, time)
  NULLS NOT DISTINCT
  WHERE studio_id IS NOT NULL
    AND artist_id IS NULL
    AND status NOT IN ('cancelled', 'rejected');

CREATE INDEX IF NOT EXISTS bookings_active_date_idx
  ON bookings (date)
  WHERE status NOT IN ('cancelled', 'rejected');
