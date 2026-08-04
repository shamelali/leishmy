import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, users, profiles } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendLeadFollowUpEmail } from "@/lib/email";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

  try {
    let dryRun = false;
    try {
      const body = (await request.json()) as { dryRun?: boolean };
      dryRun = body.dryRun === true;
    } catch {
      // empty body is fine
    }

    const staleInquiries = await db
      .select({
        id: inquiries.id,
        name: inquiries.name,
        email: inquiries.email,
        artistId: inquiries.artistId,
        createdAt: inquiries.createdAt,
      })
      .from(inquiries)
      .where(
        and(
          eq(inquiries.status, "pending"),
          sql`${inquiries.createdAt} < NOW() - INTERVAL '48 hours'`,
        ),
      )
      .orderBy(inquiries.createdAt)
      .limit(50);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const inquiry of staleInquiries) {
      if (!inquiry.email) {
        skipped += 1;
        continue;
      }

      // Look up artist name for the email
      let artistName = "the artist";
      if (inquiry.artistId) {
        const [artistUser] = await db
          .select({ name: users.name })
          .from(profiles)
          .innerJoin(users, eq(users.id, profiles.userId))
          .where(eq(profiles.userId, inquiry.artistId))
          .limit(1);
        if (artistUser?.name) artistName = artistUser.name;
      }

      if (dryRun) {
        sent += 1;
        continue;
      }

      try {
        await sendLeadFollowUpEmail({
          email: inquiry.email,
          name: inquiry.name || "there",
          artistName,
        });
        sent += 1;
      } catch (err) {
        errors += 1;
        console.error(`[lead-follow-ups] failed for inquiry ${inquiry.id}:`, err);
      }
    }

    if (!dryRun && sent > 0) {
      await db
        .update(inquiries)
        .set({ status: "followed_up" })
        .where(
          and(
            eq(inquiries.status, "pending"),
            sql`${inquiries.createdAt} < NOW() - INTERVAL '48 hours'`,
          ),
        );
    }

    await recordCronRun(
      "lead-follow-ups",
      "success",
      `Sent ${sent}, skipped ${skipped}, errors ${errors}`,
    );

    return NextResponse.json({
      success: true,
      dryRun,
      checked: staleInquiries.length,
      sent,
      skipped,
      errors,
    });
  } catch (err) {
    console.error("[cron/lead-follow-ups] error:", err);
    await recordCronRun(
      "lead-follow-ups",
      "error",
      err instanceof Error ? err.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Lead follow-up failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  }
}
