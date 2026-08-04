import "dotenv/config";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { prefixedEnvReader } from "@/lib/env-prefix";

const neauth = prefixedEnvReader("NEON_AUTH_");

const USER_IDS = [
  "600c31da-c12c-4ec5-8326-8339c3814929",
  "7f06fdbd-804e-46b6-8e74-c5d221638385",
  "2c38eb14-282b-4b3a-a72e-ca5d01786289",
];

const DEFAULT_PASSWORD = "leish777";

async function main() {
  const auth = createNeonAuth({
    baseUrl: neauth.require("BASE_URL"),
    cookies: { secret: neauth.require("COOKIE_SECRET") },
    logLevel: "silent",
  }) as any;

  for (const userId of USER_IDS) {
    console.log(`Setting password for ${userId}...`);
    try {
      const result = await auth.admin.setUserPassword({
        userId,
        newPassword: DEFAULT_PASSWORD,
      });
      if (result?.error) {
        console.log(`  ⚠️  Error: ${result.error.message}`);
      } else {
        console.log(`  ✅ Password set to "${DEFAULT_PASSWORD}"`);
      }
    } catch (e: any) {
      console.log(`  ❌ ${e.message}`);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
