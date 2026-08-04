import "dotenv/config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL;
const DEFAULT_PASSWORD = "leish777";

const RESTORED_USERS = [
  { id: "600c31da", name: "Leiynda" },
  { id: "7f06fdbd", name: "Amiera" },
  { id: "2c38eb14", name: "Nina Syah" },
];

async function main() {
  if (!NEON_AUTH_BASE_URL) {
    console.error("❌ NEON_AUTH_BASE_URL is not set");
    process.exit(1);
  }

  // Get user emails from DB
  const userIds = RESTORED_USERS.map((u) => u.id);
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.id, userIds));

  const emailMap = new Map(rows.map((r) => [r.id, r.email]));

  for (const user of RESTORED_USERS) {
    const email = emailMap.get(user.id);
    if (!email) {
      console.log(`⚠️  ${user.name} (${user.id}) — not found in DB, skipping`);
      continue;
    }

    console.log(`Setting password for ${user.name} (${email})...`);

    // Try to set password via Neon Auth admin API
    // First, try to sign them up via the auth API to ensure they exist in Neon Auth
    try {
      // Create user in Neon Auth via the sign-up endpoint
      const signUpRes = await fetch(`${NEON_AUTH_BASE_URL}/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email,
          password: DEFAULT_PASSWORD,
        }),
      });

      if (signUpRes.ok) {
        console.log(`  ✅ Created in Neon Auth and password set`);
      } else {
        const err = await signUpRes.json().catch(() => ({}));
        // If user already exists, try setting password via admin
        if (signUpRes.status === 409 || signUpRes.status === 422) {
          console.log(`  ℹ️  User already exists in Neon Auth, setting password via admin...`);
          const setPwRes = await fetch(`${NEON_AUTH_BASE_URL}/admin/set-user-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              newPassword: DEFAULT_PASSWORD,
            }),
          });
          if (setPwRes.ok) {
            console.log(`  ✅ Password set`);
          } else {
            const setPwErr = await setPwRes.json().catch(() => ({}));
            console.log(`  ⚠️  Admin set-password failed: ${setPwErr.error || setPwRes.status}`);
          }
        } else {
          console.log(`  ⚠️  Sign-up failed (${signUpRes.status}): ${err.error || "unknown"}`);
        }
      }
    } catch (e: any) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }

  console.log("\nDone. All restored users should now have password: leish777");
}

main().catch(console.error);
