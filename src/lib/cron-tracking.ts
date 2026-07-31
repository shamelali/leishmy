import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const CRON_PREFIX = "cron:last_run:";

export interface CronRunRecord {
  job: string;
  status: "success" | "error";
  timestamp: string;
  details?: string;
}

/**
 * Record the last execution of a cron job.
 * Call this at the end of each cron job route handler.
 */
export async function recordCronRun(
  jobName: string,
  status: "success" | "error",
  details?: string,
): Promise<void> {
  try {
    const key = `${CRON_PREFIX}${jobName}`;
    const value = JSON.stringify({
      status,
      timestamp: new Date().toISOString(),
      details: details || null,
    });

    await db
      .insert(adminSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: { value, updatedAt: new Date() },
      });
  } catch {
    // Silently fail — cron tracking should never break the cron job itself
  }
}

/**
 * Get the last run record for a cron job.
 */
export async function getLastCronRun(
  jobName: string,
): Promise<CronRunRecord | null> {
  try {
    const key = `${CRON_PREFIX}${jobName}`;
    const [row] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key))
      .limit(1);

    if (!row) return null;

    const parsed = JSON.parse(row.value);
    return {
      job: jobName,
      status: parsed.status,
      timestamp: parsed.timestamp,
      details: parsed.details,
    };
  } catch {
    return null;
  }
}

/**
 * Get all cron job last run records.
 */
export async function getAllCronRuns(): Promise<Record<string, CronRunRecord>> {
  try {
    const rows = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, `${CRON_PREFIX}%`));

    const result: Record<string, CronRunRecord> = {};
    for (const row of rows) {
      const jobName = row.key.replace(CRON_PREFIX, "");
      try {
        const parsed = JSON.parse(row.value);
        result[jobName] = {
          job: jobName,
          status: parsed.status,
          timestamp: parsed.timestamp,
          details: parsed.details,
        };
      } catch {
        // Skip malformed entries
      }
    }
    return result;
  } catch {
    return {};
  }
}
