-- Prevent double-booking the same artist (or unassigned studio slot) at the
-- same date + time. NULLS NOT DISTINCT treats missing time as a real value so
-- two "TBD" bookings on the same day still collide. Cancelled/rejected rows
-- are excluded so the slot can be rebooked.
--
-- Existing duplicates: only pre-payment rows (quote_pending / requested /
-- quote_sent) are auto-cancelled. Paid or in-progress collisions abort the
-- migration so they can be resolved by a human.
--
-- Idempotent: safe to re-run.

-- 1. Cancel surplus pre-payment artist-slot bookings (keep the most committed, then newest).
WITH ranked AS (
  SELECT
    id,
    status,
    ROW_NUMBER() OVER (
      PARTITION BY artist_id, date, time
      ORDER BY
        CASE status
          WHEN 'in_progress' THEN 0
          WHEN 'confirmed' THEN 1
          WHEN 'completed' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'quote_sent' THEN 4
          WHEN 'requested' THEN 5
          WHEN 'quote_pending' THEN 6
          ELSE 7
        END,
        created_at DESC NULLS LAST,
        id DESC
    ) AS rn
  FROM bookings
  WHERE artist_id IS NOT NULL
    AND status NOT IN ('cancelled', 'rejected')
)
UPDATE bookings AS b
SET status = 'cancelled', updated_at = NOW()
FROM ranked AS r
WHERE b.id = r.id
  AND r.rn > 1
  AND r.status IN ('quote_pending', 'requested', 'quote_sent');

-- 2. Cancel surplus pre-payment studio-only slot bookings.
WITH ranked AS (
  SELECT
    id,
    status,
    ROW_NUMBER() OVER (
      PARTITION BY studio_id, date, time
      ORDER BY
        CASE status
          WHEN 'in_progress' THEN 0
          WHEN 'confirmed' THEN 1
          WHEN 'completed' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'quote_sent' THEN 4
          WHEN 'requested' THEN 5
          WHEN 'quote_pending' THEN 6
          ELSE 7
        END,
        created_at DESC NULLS LAST,
        id DESC
    ) AS rn
  FROM bookings
  WHERE studio_id IS NOT NULL
    AND artist_id IS NULL
    AND status NOT IN ('cancelled', 'rejected')
)
UPDATE bookings AS b
SET status = 'cancelled', updated_at = NOW()
FROM ranked AS r
WHERE b.id = r.id
  AND r.rn > 1
  AND r.status IN ('quote_pending', 'requested', 'quote_sent');

-- 3. Abort if any paid / active collisions remain — do not silently drop money rows.
DO $$
DECLARE
  artist_dupes integer;
  studio_dupes integer;
BEGIN
  SELECT COUNT(*) INTO artist_dupes
  FROM (
    SELECT 1
    FROM bookings
    WHERE artist_id IS NOT NULL
      AND status NOT IN ('cancelled', 'rejected')
    GROUP BY artist_id, date, time
    HAVING COUNT(*) > 1
  ) d;

  SELECT COUNT(*) INTO studio_dupes
  FROM (
    SELECT 1
    FROM bookings
    WHERE studio_id IS NOT NULL
      AND artist_id IS NULL
      AND status NOT IN ('cancelled', 'rejected')
    GROUP BY studio_id, date, time
    HAVING COUNT(*) > 1
  ) d;

  IF artist_dupes > 0 OR studio_dupes > 0 THEN
    RAISE EXCEPTION
      '0035_booking_slot_unique: unresolved slot collisions (artist_groups=%, studio_groups=%). Cancel or reschedule paid/confirmed duplicates before retrying.',
      artist_dupes, studio_dupes;
  END IF;
END $$;

-- 4. Enforce uniqueness going forward.
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
