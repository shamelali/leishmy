import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkMigrations() {
  try {
    const result = await pool.query('SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 20');
    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkMigrations();