import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    await pool.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location VARCHAR(255);');
    console.log('✅ Migration successful: location column added to bookings table');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();