import "dotenv/config";
import { db } from "@/db";
import { users } from "@/db/schema";

async function main() {
  const rows = await db.select().from(users);
  console.log(`Total users: ${rows.length}\n`);
  for (const r of rows) {
    console.log(`ID: ${r.id} | Email: ${r.email} | Name: ${r.name} | Role: ${r.role}`);
  }
}
main().catch(console.error);
