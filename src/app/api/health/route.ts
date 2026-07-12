import { db } from "@/db";
import { sql } from "drizzle-orm";
import { hasBrevoKey } from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, string> = {};

  try {
    await db.execute(sql`select 1`);
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  checks.brevo = hasBrevoKey() ? "key_set" : "missing_key";

  checks.uptime = `${Math.floor(process.uptime())}s`;

  const healthy = checks.database === "ok";

  return Response.json(
    { ok: healthy, checks, ms: Date.now() - start },
    { status: healthy ? 200 : 503 },
  );
}
