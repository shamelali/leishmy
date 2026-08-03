import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [u] = await db.select().from(users).where(eq(users.id, "7f06fdbd-804e-46b6-8e74-c5d221638385")).limit(1);
  console.log(u?.email || "not found");
  process.exit(0);
}
main();