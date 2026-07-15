import { db } from "@/db";
import {
  loyaltyPoints,
  loyaltyTransactions,
  loyaltyTiers,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const POINTS_MAP: Record<string, number> = {
  booking_completed: 100,
  review_submitted: 50,
  referral: 200,
  profile_complete: 100,
  birthday: 50,
  social_share: 25,
};

export async function awardPoints(
  userId: string,
  source: string,
  referenceId?: string,
  description?: string,
) {
  const basePoints = POINTS_MAP[source] || 0;
  if (basePoints === 0) return null;

  const [currentPoints] = await db
    .select({ tier: loyaltyPoints.tier })
    .from(loyaltyPoints)
    .where(eq(loyaltyPoints.userId, userId))
    .limit(1);

  const [tierData] = await db
    .select()
    .from(loyaltyTiers)
    .where(eq(loyaltyTiers.name, currentPoints?.tier || "bronze"))
    .limit(1);

  const multiplier = Number(tierData?.multiplier || 1);
  const pointsAwarded = Math.round(basePoints * multiplier);

  await db.execute(sql`
    INSERT INTO loyalty_points (user_id, balance, lifetime_earned, lifetime_redeemed, tier, updated_at)
    VALUES (${userId}, ${pointsAwarded}, ${pointsAwarded}, 0, 'bronze', NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      balance = loyalty_points.balance + ${pointsAwarded},
      lifetime_earned = loyalty_points.lifetime_earned + ${pointsAwarded},
      updated_at = NOW()
  `);

  const [updated] = await db
    .select({ lifetimeEarned: loyaltyPoints.lifetimeEarned })
    .from(loyaltyPoints)
    .where(eq(loyaltyPoints.userId, userId))
    .limit(1);

  if (updated) {
    const newTier = await calculateTier(updated.lifetimeEarned);
    await db
      .update(loyaltyPoints)
      .set({ tier: newTier })
      .where(eq(loyaltyPoints.userId, userId));
  }

  await db.insert(loyaltyTransactions).values({
    userId,
    amount: pointsAwarded,
    type: "earned",
    source,
    referenceId: referenceId || null,
    description: description || `${source} - ${pointsAwarded} points`,
  });

  return pointsAwarded;
}

export async function redeemPoints(
  userId: string,
  amount: number,
  referenceId?: string,
) {
  const [current] = await db
    .select({ balance: loyaltyPoints.balance, lifetimeRedeemed: loyaltyPoints.lifetimeRedeemed })
    .from(loyaltyPoints)
    .where(eq(loyaltyPoints.userId, userId))
    .limit(1);

  if (!current || current.balance < amount) {
    return { success: false, error: "Insufficient points" };
  }

  await db.execute(sql`
    UPDATE loyalty_points SET
      balance = balance - ${amount},
      lifetime_redeemed = lifetime_redeemed + ${amount},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `);

  await db.insert(loyaltyTransactions).values({
    userId,
    amount: -amount,
    type: "redeemed",
    source: "redemption",
    referenceId: referenceId || null,
    description: `Redeemed ${amount} points`,
  });

  return { success: true };
}

export async function calculateTier(lifetimeEarned: number) {
  const tiers = await db
    .select()
    .from(loyaltyTiers)
    .orderBy(desc(loyaltyTiers.minPoints));

  for (const tier of tiers) {
    if (lifetimeEarned >= tier.minPoints) {
      return tier.name;
    }
  }
  return "bronze";
}

export async function getPointsBalance(userId: string) {
  const [points] = await db
    .select()
    .from(loyaltyPoints)
    .where(eq(loyaltyPoints.userId, userId))
    .limit(1);

  return points || { balance: 0, lifetimeEarned: 0, lifetimeRedeemed: 0, tier: "bronze" };
}

export async function getTransactionHistory(userId: string, limit = 50) {
  return db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.userId, userId))
    .orderBy(desc(loyaltyTransactions.createdAt))
    .limit(limit);
}

export async function getTierInfo(tierName: string) {
  const [tier] = await db
    .select()
    .from(loyaltyTiers)
    .where(eq(loyaltyTiers.name, tierName))
    .limit(1);
  return tier || null;
}

export async function getNextTier(tierName: string) {
  const tiers = await db
    .select()
    .from(loyaltyTiers)
    .orderBy(loyaltyTiers.minPoints);

  const currentIdx = tiers.findIndex((t) => t.name === tierName);
  if (currentIdx < tiers.length - 1) {
    return tiers[currentIdx + 1];
  }
  return null;
}

export async function getAllTiers() {
  return db
    .select()
    .from(loyaltyTiers)
    .orderBy(loyaltyTiers.minPoints);
}
