import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/cron/sync-auth-users
 *
 * Finds orphaned Neon Auth users (in neon_auth.user but not in public.user)
 * and deletes them. This handles cases where registration started in Neon Auth
 * but profile creation failed, leaving the user unable to re-register.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";

    const orphanResult = await client.query(`
      SELECT na.id, na.email, na.name
      FROM neon_auth."user" na
      LEFT JOIN public."user" pu ON pu.id = na.id
      WHERE pu.id IS NULL
    `);

    const orphans = orphanResult.rows;

    if (orphans.length === 0) {
      await recordCronRun("sync-auth-users", "success", "No orphaned users found");
      return NextResponse.json({ success: true, orphansFound: 0, deleted: 0 });
    }

    if (dryRun) {
      await recordCronRun("sync-auth-users", "success", `Dry run: found ${orphans.length} orphans`);
      return NextResponse.json({
        success: true,
        dryRun: true,
        orphansFound: orphans.length,
        orphans: orphans.map((o) => ({ id: o.id, email: o.email, name: o.name })),
      });
    }

    let deleted = 0;
    for (const orphan of orphans) {
      await client.query('DELETE FROM neon_auth."user" WHERE id = $1', [orphan.id]);
      deleted++;
    }

    await recordCronRun("sync-auth-users", "success", `Found ${orphans.length} orphans, deleted ${deleted}`);

    return NextResponse.json({
      success: true,
      orphansFound: orphans.length,
      deleted,
    });
  } catch (err) {
    console.error("[cron/sync-auth-users] error:", err);
    await recordCronRun("sync-auth-users", "error", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Sync failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
