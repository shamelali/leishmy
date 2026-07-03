import "dotenv/config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/set-admin.ts <email>");
    process.exit(1);
  }

  const [user] = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, email))
    .returning();

  if (user) {
    console.log(`✅ ${email} is now admin`);
  } else {
    console.error("❌ User not found");
    process.exit(1);
  }
}

main().catch(console.error);
