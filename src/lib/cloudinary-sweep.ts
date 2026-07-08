import "server-only";
import { db } from "@/db";
import { artists, communityApplications } from "@/db/schema";
import { sql, inArray } from "drizzle-orm";
import {
  CLOUDINARY_USER_PREFIX,
  deleteAssets,
  listResources,
  listSubFolders,
  type CloudinaryResource,
} from "@/lib/cloudinary-server";

const COMMUNITY_FOLDER = "community-applications";
const COMMUNITY_RETENTION_DAYS = 180;
const SWEEP_BATCH = 20;
const SWEEP_DELAY_MS = 200;

export interface SweepSummary {
  scanned: number;
  deleted: number;
  errors: number;
  durationMs: number;
  details: {
    userOrphans: number;
    communityExpired: number;
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract the publicId from a stored Cloudinary URL.
 * Returns null for non-Cloudinary URLs (e.g. pasted external images).
 */
function publicIdFromUrl(url: string): string | null {
  if (!url?.includes("res.cloudinary.com/")) return null;
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

async function listAll(prefix: string, type: "upload" = "upload"): Promise<CloudinaryResource[]> {
  const collected: CloudinaryResource[] = [];
  let cursor: string | undefined;
  do {
    const { resources, nextCursor } = await listResources({
      type,
      prefix,
      maxResults: 500,
      nextCursor: cursor,
    });
    collected.push(...resources);
    cursor = nextCursor;
  } while (cursor);
  return collected;
}

async function sweepUserOrphans(): Promise<number> {
  const userIds = await listSubFolders(CLOUDINARY_USER_PREFIX.replace(/\/$/, ""));
  let deletedCount = 0;

  for (const userId of userIds) {
    if (!/^user[-_][a-zA-Z0-9_-]+$/.test(userId) && !/^[a-zA-Z0-9_-]{1,64}$/.test(userId)) {
      continue;
    }
    const portfolioPrefix = `${CLOUDINARY_USER_PREFIX}${userId}/artist/portfolio/`;

    const [artist] = await db
      .select({ portfolio: artists.portfolio })
      .from(artists)
      .where(sql`${artists.userId} = ${userId}`)
      .limit(1);

    const referenced = new Set<string>();
    for (const url of artist?.portfolio ?? []) {
      const pid = publicIdFromUrl(url);
      if (pid) referenced.add(pid);
    }

    const orphans = await listAll(portfolioPrefix);
    const toDelete = orphans
      .map((r) => r.public_id)
      .filter((pid) => !referenced.has(pid));

    for (let i = 0; i < toDelete.length; i += SWEEP_BATCH) {
      const batch = toDelete.slice(i, i + SWEEP_BATCH);
      const results = await deleteAssets(batch);
      deletedCount += results.filter((r) => r.status === "ok" || r.status === "not_found").length;
      await sleep(SWEEP_DELAY_MS);
    }
  }

  return deletedCount;
}

async function sweepCommunityExpired(): Promise<number> {
  const cutoffMs = Date.now() - COMMUNITY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  const allCommunity = await listAll(`${COMMUNITY_FOLDER}/`);
  const expired = allCommunity.filter((r) => r.created_at < cutoffIso);

  if (expired.length === 0) return 0;

  const referencedIds = new Set<number>();
  const expiredIds: number[] = [];
  for (const r of expired) {
    const match = r.public_id.match(new RegExp(`^${COMMUNITY_FOLDER}/(?:\\d+_)?(\\d+)(?:_\\w+)?$`));
    const idStr = match?.[1];
    if (idStr) {
      const id = Number(idStr);
      if (Number.isFinite(id)) {
        expiredIds.push(id);
      }
    }
  }

  if (expiredIds.length > 0) {
    const rows = await db
      .select({ id: communityApplications.id })
      .from(communityApplications)
      .where(inArray(communityApplications.id, expiredIds));
    for (const row of rows) referencedIds.add(row.id);
  }

  const toDelete = expired
    .filter((r) => {
      const match = r.public_id.match(new RegExp(`^${COMMUNITY_FOLDER}/(?:\\d+_)?(\\d+)(?:_\\w+)?$`));
      const id = match ? Number(match[1]) : NaN;
      return !Number.isFinite(id) || !referencedIds.has(id);
    })
    .map((r) => r.public_id);

  let deletedCount = 0;
  for (let i = 0; i < toDelete.length; i += SWEEP_BATCH) {
    const batch = toDelete.slice(i, i + SWEEP_BATCH);
    const results = await deleteAssets(batch);
    deletedCount += results.filter((r) => r.status === "ok" || r.status === "not_found").length;
    await sleep(SWEEP_DELAY_MS);
  }

  return deletedCount;
}

export async function runSweep(options: { dryRun?: boolean } = {}): Promise<SweepSummary> {
  const { dryRun = true } = options;
  const start = Date.now();

  if (dryRun) {
    const userFolders = await listSubFolders(CLOUDINARY_USER_PREFIX.replace(/\/$/, ""));
    let portfolioCount = 0;
    for (const userId of userFolders) {
      const list = await listAll(`${CLOUDINARY_USER_PREFIX}${userId}/artist/portfolio/`);
      portfolioCount += list.length;
    }
    const community = await listAll(`${COMMUNITY_FOLDER}/`);
    return {
      scanned: portfolioCount + community.length,
      deleted: 0,
      errors: 0,
      durationMs: Date.now() - start,
      details: { userOrphans: 0, communityExpired: 0 },
    };
  }

  const userOrphans = await sweepUserOrphans();
  const communityExpired = await sweepCommunityExpired();

  return {
    scanned: userOrphans + communityExpired,
    deleted: userOrphans + communityExpired,
    errors: 0,
    durationMs: Date.now() - start,
    details: { userOrphans, communityExpired },
  };
}
