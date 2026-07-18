import "dotenv/config";
import { db } from "../src/db";
import { users, artists, categories } from "../src/db/schema";
import { count } from "drizzle-orm";

async function main() {
  try {
    const [userCount, artistCount, categoryCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(artists),
      db.select({ count: count() }).from(categories),
    ]);
    console.log("Users:", userCount[0]?.count);
    console.log("Artists:", artistCount[0]?.count);
    console.log("Categories:", categoryCount[0]?.count);
  } catch (err) {
    console.error("DB query failed:", err);
  }
  process.exit(0);
}

main();
