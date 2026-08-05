import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receivedEmails, adminSettings } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendInboundAckEmail } from "@/lib/email";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ACK_PREFIX = "email:ack:";
const LOOKBACK_MINUTES = 24 * 60;

function aliasLabel(recipient: string): string {
  const local = recipient.split("@")[0]?.toLowerCase() || "";
  if (["support", "help", "info"].includes(local)) return "support";
  if (["billing", "payment", "invoice"].includes(local)) return "billing";
  if (["artist", "studio", "partner"].includes(local)) return "artist";
  return "info";
}

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

    const cutoff = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000);

    const recentEmails = await db
      .select({
        id: receivedEmails.id,
        recipient: receivedEmails.recipient,
        sender: receivedEmails.sender,
        subject: receivedEmails.subject,
        messageId: receivedEmails.messageId,
        createdAt: receivedEmails.createdAt,
      })
      .from(receivedEmails)
      .where(gt(receivedEmails.createdAt, cutoff))
      .orderBy(receivedEmails.createdAt)
      .limit(50);

    let acked = 0;
    let skipped = 0;
    let errors = 0;

    for (const email of recentEmails) {
      if (!email.sender || !email.recipient) {
        skipped += 1;
        continue;
      }

      const dedupKey = email.messageId || `id:${email.id}`;
      const settingKey = `${ACK_PREFIX}${dedupKey}`;

      const [existing] = await db
        .select({ id: adminSettings.id })
        .from(adminSettings)
        .where(eq(adminSettings.key, settingKey))
        .limit(1);

      if (existing) {
        skipped += 1;
        continue;
      }

      const label = aliasLabel(email.recipient);

      if (dryRun) {
        acked += 1;
        continue;
      }

      try {
        await sendInboundAckEmail({
          to: email.sender,
          from: email.recipient,
          aliasLabel: label,
        });

        await db
          .insert(adminSettings)
          .values({
            key: settingKey,
            value: JSON.stringify({
              status: "acked",
              timestamp: new Date().toISOString(),
              recipient: email.recipient,
              sender: email.sender,
            }),
          })
          .onConflictDoUpdate({
            target: adminSettings.key,
            set: {
              value: JSON.stringify({
                status: "acked",
                timestamp: new Date().toISOString(),
              }),
            },
          });

        acked += 1;
      } catch (err) {
        errors += 1;
        console.error(`[inbound-email-ack] failed for email ${email.id}:`, err);
      }
    }

    await recordCronRun(
      "inbound-email-ack",
      "success",
      `Acked ${acked}, skipped ${skipped}, errors ${errors}`,
    );

    return NextResponse.json({
      success: true,
      dryRun,
      checked: recentEmails.length,
      acked,
      skipped,
      errors,
    });
  } catch (err) {
    console.error("[cron/inbound-email-ack] error:", err);
    await recordCronRun(
      "inbound-email-ack",
      "error",
      err instanceof Error ? err.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Inbound email ack failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  }
}
