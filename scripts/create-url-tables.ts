import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function createTables() {
  const client = await pool.connect();
  try {
    // Create tables directly
    await client.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        url TEXT NOT NULL,
        custom BOOLEAN DEFAULT false NOT NULL,
        clicks INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS urls_created_idx ON urls (created_at);
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS url_analytics (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) NOT NULL,
        referer TEXT,
        user_agent TEXT,
        country VARCHAR(100),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS url_analytics_code_idx ON url_analytics (code);
      CREATE INDEX IF NOT EXISTS url_analytics_timestamp_idx ON url_analytics (timestamp);
    `);
    
    console.log('Tables created successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

createTables().catch(console.error);
