import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

function readUnpooled() {
  const p = path.join(process.cwd(), '.vercel', '.env.production.local');
  if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
  const txt = fs.readFileSync(p, 'utf8');
  const m = txt.match(/^DATABASE_URL_UNPOOLED=(?:\"|\')?(.*?)(?:\"|\')?$/m);
  if (!m) throw new Error('DATABASE_URL_UNPOOLED not found in .vercel/.env.production.local');
  return m[1];
}

async function main() {
  const conn = readUnpooled();
  console.log('Using connection prefix:', conn.substring(0, 40) + '...');
  const pool = new Pool({ connectionString: conn });
  try {
    const r1 = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='availability_rules') AS availability_rules_exists, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='availability_overrides') AS availability_overrides_exists;"
    );
    console.log('availability:', r1.rows);

    const r2 = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='promo_code_id') AS promo_column_exists;"
    );
    console.log('promo_column:', r2.rows);
  } catch (e) {
    console.error('Query error:', e instanceof Error ? e.message : e);
  } finally {
    await pool.end();
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });
