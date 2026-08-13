/**
 * Apply / verify drizzle/0035_booking_slot_unique.sql against DATABASE_URL.
 *
 *   DATABASE_URL='postgresql://...' pnpm tsx scripts/apply-booking-slot-unique.ts
 *   DATABASE_URL='postgresql://...' pnpm tsx scripts/apply-booking-slot-unique.ts --check
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const CHECK_ONLY = process.argv.includes("--check");

const INDEXES = [
  "bookings_artist_date_time_unique",
  "bookings_studio_date_time_unique",
  "bookings_active_date_idx",
] as const;

async function reportCollisions(pool: Pool) {
  const artist = await pool.query<{
    artist_id: string;
    date: Date;
    time: string | null;
    ids: number[];
    statuses: string[];
    count: string;
  }>(`
    SELECT artist_id, date, time,
           array_agg(id ORDER BY id) AS ids,
           array_agg(status ORDER BY id) AS statuses,
           COUNT(*)::text AS count
    FROM bookings
    WHERE artist_id IS NOT NULL
      AND status NOT IN ('cancelled', 'rejected')
    GROUP BY artist_id, date, time
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, date
    LIMIT 50
  `);

  const studio = await pool.query<{
    studio_id: string;
    date: Date;
    time: string | null;
    ids: number[];
    statuses: string[];
    count: string;
  }>(`
    SELECT studio_id, date, time,
           array_agg(id ORDER BY id) AS ids,
           array_agg(status ORDER BY id) AS statuses,
           COUNT(*)::text AS count
    FROM bookings
    WHERE studio_id IS NOT NULL
      AND artist_id IS NULL
      AND status NOT IN ('cancelled', 'rejected')
    GROUP BY studio_id, date, time
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, date
    LIMIT 50
  `);

  return { artist: artist.rows, studio: studio.rows };
}

async function indexStatus(pool: Pool) {
  const result = await pool.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = 'public' AND indexname = ANY($1::text[])`,
    [INDEXES],
  );
  const present = new Set(result.rows.map((r) => r.indexname));
  return INDEXES.map((name) => ({ name, exists: present.has(name) }));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const before = await reportCollisions(pool);
    console.log(
      `[0035] collisions before: artist=${before.artist.length} studio=${before.studio.length}`,
    );
    if (before.artist.length) console.log("[0035] artist collisions:", before.artist);
    if (before.studio.length) console.log("[0035] studio collisions:", before.studio);

    if (!CHECK_ONLY) {
      const sqlPath = path.join(process.cwd(), "drizzle/0035_booking_slot_unique.sql");
      const sql = fs.readFileSync(sqlPath, "utf8");
      console.log("[0035] applying", sqlPath);
      await pool.query(sql);
      console.log("[0035] applied");
    }

    const after = await reportCollisions(pool);
    const indexes = await indexStatus(pool);
    console.log(
      `[0035] collisions after: artist=${after.artist.length} studio=${after.studio.length}`,
    );
    console.table(indexes);

    const missing = indexes.filter((i) => !i.exists);
    if (!CHECK_ONLY && (after.artist.length || after.studio.length || missing.length)) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[0035] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
