import "dotenv/config";
import { Pool } from "pg";

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "received_emails" (
      "id" serial PRIMARY KEY NOT NULL,
      "recipient" text NOT NULL,
      "sender" text NOT NULL,
      "subject" text,
      "body_text" text,
      "body_html" text,
      "source" text DEFAULT 'brevo-inbound',
      "message_id" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "received_emails_recipient_idx" ON "received_emails" USING btree ("recipient");
    CREATE INDEX IF NOT EXISTS "received_emails_created_idx" ON "received_emails" USING btree ("created_at");
  `);

  console.log("Migration complete: received_emails table created.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
