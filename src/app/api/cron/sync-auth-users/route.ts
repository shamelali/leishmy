import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import { Pool, PoolClient } from "pg";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Helper to lazily initialize a cached Pool for Neon Auth reads. This keeps the
// pool alive across invocations similar to src/db/index.ts's cached pool.
function getNeonAuthPool() {
  const g = globalThis as typeof globalThis & { __neonAuthPool?: Pool };
  if (!g.__neonAuthPool) {
    const neonUrl = process.env.NEON_AUTH_URL;
    if (!neonUrl) {
      throw new Error("NEON_AUTH_URL must be set to read Neon Auth users");
    }
    g.__neonAuthPool = new Pool({
      connectionString: neonUrl,
      max: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
    g.__neonAuthPool.on("error", (err) => {
      console.error("[neonAuthPool] idle client error:", err.message);
      g.__neonAuthPool = undefined;
    });
  }
  return g.__neonAuthPool;
}

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

  let supClient: PoolClient | undefined;
  let neonClient: PoolClient | undefined;
  try {
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";

    const neonPool = getNeonAuthPool();

    // Read the full user set from each DB separately (they are separate
    // databases and cannot be JOINed in a single query), then reconcile
    // in application code. In dry-run mode we use pool.query directly so
    // no dedicated client connection is held for the duration.
    if (dryRun) {
      const [neonRows, supRows] = await Promise.all([
        neonPool.query('SELECT id, email, name FROM neon_auth."user"'),
        pool.query('SELECT id, email FROM public."user"'),
      ]);

      const supByNeonId = new Map(
        supRows.rows.map((r) => [String(r.id), r.email]),
      );

      const diverged: Array<{ id: string; current_email: string; new_email: string }> = [];
      const orphans: Array<{ id: string; email: string; name?: string }> = [];

      for (const na of neonRows.rows) {
        const id = String(na.id);
        const supEmail = supByNeonId.get(id);
        if (supEmail === undefined) {
          orphans.push({ id, email: na.email, name: na.name });
        } else if (na.email !== supEmail) {
          diverged.push({ id, current_email: supEmail, new_email: na.email });
        }
      }

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

    // Non-dry-run: acquire dedicated clients for the write phase.
    supClient = await pool.connect();
    neonClient = await neonPool.connect();

    // Re-read inside the transaction context — both DBs read fresh so we
    // reconcile against the latest state right before applying writes.
    const [neonRows, supRows] = await Promise.all([
      neonClient.query('SELECT id, email, name FROM neon_auth."user"'),
      supClient.query('SELECT id, email FROM public."user"'),
    ]);

    const supByNeonId = new Map(
      supRows.rows.map((r) => [String(r.id), r.email]),
    );

    const diverged: Array<{ id: string; current_email: string; new_email: string }> = [];
    const orphans: Array<{ id: string; email: string; name?: string }> = [];

    for (const na of neonRows.rows) {
      const id = String(na.id);
      const supEmail = supByNeonId.get(id);
      if (supEmail === undefined) {
        orphans.push({ id, email: na.email, name: na.name });
      } else if (na.email !== supEmail) {
        diverged.push({ id, current_email: supEmail, new_email: na.email });
      }
    }

    let synced = 0;
    for (const row of diverged) {
      await supClient.query('UPDATE public."user" SET email = $1 WHERE id = $2', [row.new_email, row.id]);
      synced++;
    }

    let deleted = 0;
    for (const orphan of orphans) {
      await neonClient.query('DELETE FROM neon_auth."user" WHERE id = $1', [orphan.id]);
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
    if (supClient) try { await supClient.release(); } catch (e) { console.error("[cron/sync-auth-users] supClient.release failed:", e); }
    if (neonClient) try { await neonClient.release(); } catch (e) { console.error("[cron/sync-auth-users] neonClient.release failed:", e); }
  }
}
