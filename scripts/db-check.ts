import "dotenv/config";
import { db } from "../src/db";
import { users, profiles, categories } from "../src/db/schema";
import { count, eq } from "drizzle-orm";

async function main() {
  try {
    const [userCount, artistCount, studioCount, categoryCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(profiles).where(eq(profiles.role, "artist")),
      db.select({ count: count() }).from(profiles).where(eq(profiles.role, "studio")),
      db.select({ count: count() }).from(categories),
    ]);
    console.log("Users:", userCount[0]?.count);
    console.log("Artists:", artistCount[0]?.count);
    console.log("Studios:", studioCount[0]?.count);
    console.log("Categories:", categoryCount[0]?.count);
  } catch (err) {
    console.error("DB query failed:", err);
  }
  process.exit(0);
}

main();
