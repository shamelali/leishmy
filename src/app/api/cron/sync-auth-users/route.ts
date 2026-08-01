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
 * 1. Syncs divergent emails: for users present in BOTH neon_auth.user (source
 *    of truth via Neon Auth) and public.user, updates public.user.email to the
 *    Neon Auth address when they differ. This is required because every
 *    transactional emailer (booking confirmations, reminders cron, payment
 *    webhook) reads public.user.email, and a drifted row silently misroutes
 *    customer emails.
 * 2. Finds orphaned Neon Auth users (in neon_auth.user but not in public.user)
 *    and deletes them. This handles cases where registration started in Neon Auth
 *    but profile creation failed, leaving the user unable to re-register.
 *
 * Pass ?dryRun=true to preview without writing.
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

    // Sync stale emails: neon_auth."user" is authoritative (Neon Auth). Every
    // transactional emailer (booking confirmations, reminders cron, payment
    // webhook) reads public."user".email, so a drifted row silently misroutes
    // customer emails. Propagate any divergence for matched users.
    const syncResult = await client.query(`
      SELECT na.id, na.email AS new_email, pu.email AS current_email
      FROM neon_auth."user" na
      JOIN public."user" pu ON pu.id = na.id::text
      WHERE na.email IS DISTINCT FROM pu.email
    `);
    const diverged = syncResult.rows;

    const orphanResult = await client.query(`
      SELECT na.id, na.email, na.name
      FROM neon_auth."user" na
      LEFT JOIN public."user" pu ON pu.id = na.id::text
      WHERE pu.id IS NULL
    `);

    const orphans = orphanResult.rows;

    if (dryRun) {
      await recordCronRun(
        "sync-auth-users",
        "success",
        `Dry run: ${diverged.length} email(s) to sync, ${orphans.length} orphan(s) to delete`,
      );
      return NextResponse.json({
        success: true,
        dryRun: true,
        emailsToSync: diverged.length,
        orphansFound: orphans.length,
        synced: diverged.map((d) => ({
          id: d.id,
          currentEmail: d.current_email,
          newEmail: d.new_email,
        })),
        orphans: orphans.map((o) => ({ id: o.id, email: o.email, name: o.name })),
      });
    }

    let synced = 0;
    for (const row of diverged) {
      await client.query('UPDATE public."user" SET email = $1 WHERE id = $2', [row.new_email, row.id]);
      synced++;
    }

    let deleted = 0;
    for (const orphan of orphans) {
      await client.query('DELETE FROM neon_auth."user" WHERE id = $1', [orphan.id]);
      deleted++;
    }

    await recordCronRun(
      "sync-auth-users",
      "success",
      `${synced} email(s) synced, found ${orphans.length} orphans, deleted ${deleted}`,
    );

    return NextResponse.json({
      success: true,
      emailsSynced: synced,
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
