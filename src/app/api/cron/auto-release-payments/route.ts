import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, payouts, bookings, notifications, adminSettings, profiles, users } from "@/db/schema";
import { awardPoints } from "@/lib/loyalty";
import { eq, and, lte } from "drizzle-orm";
import { Redis } from "@upstash/redis";
import { verifyCronSecret } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron-tracking";
import { logAudit } from "@/lib/audit";
import { createPayoutOrder, resolveBankCode, type PayoutOrderResult } from "@/lib/billplz-payout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOCK_KEY = "leish:auto-release:lock";
const LOCK_TTL_SECONDS = 10 * 60;
const COOLING_DAYS = 3;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

async function acquireLock(): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;
  const acquired = await redis.set(LOCK_KEY, "1", { nx: true, ex: LOCK_TTL_SECONDS });
  return acquired === "OK";
}

async function releaseLock() {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(LOCK_KEY);
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

  if (!(await acquireLock())) {
    return NextResponse.json(
      { error: "Auto-release already running" },
      { status: 409 },
    );
  }

  try {
    let dryRun = false;
    try {
      const body = (await request.json()) as { dryRun?: boolean };
      dryRun = body.dryRun === true;
    } catch {
      // empty body is fine
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - COOLING_DAYS);

    const rows = await db
      .select({
        paymentId: payments.id,
        paymentAmount: payments.amount,
        paymentStatus: payments.status,
        billplzId: payments.billplzId,
        bookingId: bookings.id,
        bookingDate: bookings.date,
        userId: bookings.userId,
        artistId: bookings.artistId,
        studioId: bookings.studioId,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          eq(payments.status, "paid"),
          lte(bookings.date, cutoffDate),
        ),
      )
      .orderBy(payments.id);

    const details: {
      paymentId: number;
      bookingId: number | null;
      recipientId: string | null;
      amount: number;
      commissionRate: number;
      commissionAmount: number;
      netAmount: number;
      released: boolean;
      reason: string;
    }[] = [];

    let released = 0;
    let skipped = 0;
    let errors = 0;

    // Fetch current commission rate from admin_settings (default 8%)
    const [commissionSetting] = await db
      .select({ value: adminSettings.value })
      .from(adminSettings)
      .where(eq(adminSettings.key, "commission_rate"))
      .limit(1);
    const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.08;

    for (const row of rows) {
      const recipientId = row.artistId || row.studioId;

      if (!recipientId) {
        skipped += 1;
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId: null,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: 0,
          netAmount: 0,
          released: false,
          reason: "no artistId or studioId on booking",
        });
        continue;
      }

      if (dryRun) {
        const commissionAmt = Math.round(row.paymentAmount * commissionRate);
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: commissionAmt,
          netAmount: row.paymentAmount - commissionAmt,
          released: false,
          reason: "dry run",
        });
        continue;
      }

      try {
        const commissionAmt = Math.round(row.paymentAmount * commissionRate);
        const netAmount = row.paymentAmount - commissionAmt;

        // Resolve the recipient's bank details so we can dispatch a real Payment Order.
        const [recipientProfile] = await db
          .select({
            bankCode: profiles.bankCode,
            bankName: profiles.bankName,
            accountNumber: profiles.accountNumber,
            accountHolder: profiles.accountHolder,
            email: users.email,
          })
          .from(profiles)
          .innerJoin(users, eq(users.id, recipientId))
          .where(eq(profiles.userId, recipientId))
          .limit(1);

        const bankCode = resolveBankCode(
          recipientProfile?.bankCode,
          recipientProfile?.bankName,
        );
        const accountNumber = recipientProfile?.accountNumber ?? null;
        const accountHolder = recipientProfile?.accountHolder ?? null;
        const recipientEmail = recipientProfile?.email ?? null;

        const referenceId = `payout-${row.paymentId}`;

        // Commit local escrow release FIRST (payment released, booking
        // completed, payout row created as pending). Only after this commit
        // succeeds do we dispatch the real Payment Order — so we never send
        // money when the local transaction fails. If dispatch subsequently
        // fails or is missing bank details, the payout row stays `pending`
        // for the admin `mark-payouts-paid` flow, matching intended behavior.
        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({ status: "released", releasedAt: new Date(), updatedAt: new Date() })
            .where(eq(payments.id, row.paymentId));

          if (row.bookingId) {
            await tx
              .update(bookings)
              .set({ status: "completed", updatedAt: new Date() })
              .where(eq(bookings.id, row.bookingId));
          }

          const [existing] = await tx
            .select({ id: payouts.id })
            .from(payouts)
            .where(eq(payouts.paymentId, row.paymentId))
            .limit(1);

          if (!existing) {
            await tx.insert(payouts).values({
              userId: recipientId,
              amount: row.paymentAmount,
              commissionRate: String(commissionRate),
              commissionAmount: commissionAmt,
              netAmount,
              status: "pending",
              paymentId: row.paymentId,
            });
          }
        });

        // Dispatch the real money movement to the recipient's bank now that
        // local state is committed. Reference id is stable per payment so a
        // retry reuses the same idempotency key (Billplz dedupes per Payment
        // Order Collection).
        let order: PayoutOrderResult | null = null;
        let dispatchError: string | null = null;

        if (bankCode && accountNumber && accountHolder) {
          try {
            order = await createPayoutOrder({
              referenceId,
              bankCode,
              bankAccountNumber: accountNumber,
              accountName: accountHolder,
              description: `Payout for booking #${row.bookingId ?? row.paymentId}`,
              total: netAmount,
              email: recipientEmail ?? undefined,
            });
          } catch (err) {
            dispatchError =
              err instanceof Error ? err.message : "payout dispatch failed";
          }
        } else {
          dispatchError = "missing bank details";
        }

        // Record the dispatch result on the payout row.
        if (order?.id) {
          await db
            .update(payouts)
            .set({
              payoutOrderId: order.id,
              billplzPayoutStatus: order.status,
              dispatchedAmount: netAmount,
              dispatchedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payouts.paymentId, row.paymentId));
        }

        await db.insert(notifications).values({
          userId: recipientId,
          type: "payout_released",
          title: "Payment Released from Escrow",
          body: order
            ? `MYR ${(netAmount / 100).toLocaleString()} has been released and a payout order (${order.status}) was dispatched to your bank account.`
            : `MYR ${(netAmount / 100).toLocaleString()} has been released (commission: MYR ${(commissionAmt / 100).toLocaleString()}). Payout pending — your bank details ${dispatchError}.`,
          data: { link: "/dashboard/artist", bookingId: row.bookingId },
        });

        await logAudit(db, {
          actorId: "system",
          action: "payment.released",
          entityType: "payment",
          entityId: String(row.paymentId),
          meta: {
            bookingId: row.bookingId,
            recipientId,
            grossAmount: row.paymentAmount,
            commissionRate,
            commissionAmount: commissionAmt,
            netAmount,
            payoutOrderId: order?.id ?? null,
            billplzPayoutStatus: order?.status ?? null,
            dispatchError,
          },
        });

        if (row.userId) {
          awardPoints(row.userId, "booking_completed", String(row.bookingId), `Booking #${row.bookingId} completed`).catch((err) => {
            console.error("[auto-release] awardPoints failed", { paymentId: row.paymentId, err });
          });
        }

        released += 1;
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: commissionAmt,
          netAmount,
          released: true,
          reason: order ? `released, order ${order.status}` : `released (${dispatchError})`,
        });
      } catch (err) {
        errors += 1;
        console.error(`[auto-release] failed for payment ${row.paymentId}:`, err);
        details.push({
          paymentId: row.paymentId,
          bookingId: row.bookingId,
          recipientId,
          amount: row.paymentAmount,
          commissionRate,
          commissionAmount: 0,
          netAmount: 0,
          released: false,
          reason: `error: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    }

    await recordCronRun("auto-release-payments", "success", `Released ${released}, skipped ${skipped}, errors ${errors}`);

    return NextResponse.json({
      success: true,
      dryRun,
      checked: rows.length,
      released,
      skipped,
      errors,
      details,
    });
  } catch (err) {
    console.error("[cron/auto-release-payments] error:", err);
    await recordCronRun("auto-release-payments", "error", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Auto-release failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  } finally {
    await releaseLock();
  }
}
