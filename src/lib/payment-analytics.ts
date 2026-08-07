import { db } from "@/db";
import { payments, bookings, payouts, users, webhookEvents } from "@/db/schema";
import { eq, and, gte, lte, sql, count, avg, sum } from "drizzle-orm";
import { env } from "@/lib/env";

/**
 * Payment analytics service for tracking payment performance metrics
 */
export class PaymentAnalytics {
  /**
   * Get payment success rate by payment method for a given time period
   */
  static async getSuccessRateByMethod(
    startDate: Date,
    endDate: Date = new Date()
  ) {
    const results = await db
      .select({
        method: payments.method,
        total: count(payments.id),
        successful: count(sql`CASE WHEN ${payments.status} = 'paid' THEN 1 ELSE NULL END`),
        successRate: sql<number>`
          CASE 
            WHEN COUNT(${payments.id}) = 0 THEN 0 
            ELSE 
              CAST(COUNT(CASE WHEN ${payments.status} = 'paid' THEN 1 END) AS FLOAT) 
              / COUNT(${payments.id}) 
          END
        `,
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      )
      .groupBy(payments.method);

    return results;
  }

  /**
   * Get payment volume trends over time
   */
  static async getVolumeTrends(
    interval: "day" | "week" | "month" = "day",
    startDate: Date,
    endDate: Date = new Date()
  ) {
    let dateTrunc: any;
    switch (interval) {
      case "day":
        dateTrunc = sql`DATE(${payments.createdAt})`;
        break;
      case "week":
        dateTrunc = sql`DATE_TRUNC('week', ${payments.createdAt})`;
        break;
      case "month":
        dateTrunc = sql`DATE_TRUNC('month', ${payments.createdAt})`;
        break;
    }

    const results = await db
      .select({
        period: dateTrunc.as("period"),
        totalCount: count(payments.id),
        successfulCount: count(sql`CASE WHEN ${payments.status} = 'paid' THEN 1 ELSE NULL END`),
        failedCount: count(sql`CASE WHEN ${payments.status} = 'failed' THEN 1 ELSE NULL END`),
        pendingCount: count(sql`CASE WHEN ${payments.status} = 'pending' THEN 1 ELSE NULL END`),
        totalAmount: sum(sql`CASE WHEN ${payments.status} = 'paid' THEN ${payments.amount} ELSE 0 END`),
        avgAmount: avg(sql`CASE WHEN ${payments.status} = 'paid' THEN ${payments.amount} ELSE NULL END`),
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      )
      .groupBy(dateTrunc)
      .orderBy(dateTrunc);

    return results;
  }

  /**
   * Get average payment processing time (from creation to payment)
   */
  static async getAverageProcessingTime(
    startDate: Date,
    endDate: Date = new Date()
  ) {
    const results = await db
      .select({
        avgProcessingTimeMs: avg(
          sql<number>`EXTRACT(EPOCH FROM (${payments.paidAt} - ${payments.createdAt})) * 1000`
        ),
        count: count(sql`CASE WHEN ${payments.status} = 'paid' AND ${payments.paidAt} IS NOT NULL THEN 1 ELSE NULL END`)
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      );

    return results[0];
  }

  /**
   * Get pending payouts aging report
   */
  static async getPendingPayoutsAging() {
    const results = await db
      .select({
        payoutId: payouts.id,
        amount: payouts.amount,
        netAmount: payouts.netAmount,
        status: payouts.status,
        createdAt: payouts.createdAt,
        daysPending: sql<number>`EXTRACT(EPOCH FROM (NOW() - ${payouts.createdAt})) / 86400`,
        userId: payouts.userId,
        // Join with user info for context
        userEmail: users.email,
        userName: users.name,
      })
      .from(payouts)
      .leftJoin(users, eq(payouts.userId, users.id))
      .where(eq(payouts.status, "pending"))
      .orderBy(payouts.createdAt);

    return results;
  }

  /**
   * Get webhook processing metrics
   */
  static async getWebhookMetrics(
    startDate: Date,
    endDate: Date = new Date()
  ) {
    const [result] = await db
      .select({
        total: count(webhookEvents.id),
        successful: count(sql`CASE WHEN ${webhookEvents.status} = 'processed' THEN 1 ELSE NULL END`),
        failed: count(sql`CASE WHEN ${webhookEvents.status} = 'rejected' THEN 1 ELSE NULL END`),
        retryQueued: count(sql`CASE WHEN ${webhookEvents.status} = 'retry_queued' THEN 1 ELSE NULL END`),
        retryScheduled: count(sql`CASE WHEN ${webhookEvents.status} = 'retry_scheduled' THEN 1 ELSE NULL END`),
        deadLetter: count(sql`CASE WHEN ${webhookEvents.status} = 'dead_letter' THEN 1 ELSE NULL END`),
        // Note: webhookEvents table doesn't have updatedAt column, so we can't calculate processing time
        avgProcessingTimeMs: sql<number>`0`
      })
      .from(webhookEvents)
      .where(
        and(
          gte(webhookEvents.createdAt, startDate),
          lte(webhookEvents.createdAt, endDate)
        )
      );

    const total = Number(result.total) || 0;
    const failed = Number(result.failed) || 0;
    const retryRate = total > 0 ? (Number(result.retryQueued) + Number(result.retryScheduled)) / total * 100 : 0;

    return {
      totalWebhooks: total,
      successfulWebhooks: Number(result.successful) || 0,
      failedWebhooks: failed,
      retryQueued: Number(result.retryQueued) || 0,
      retryScheduled: Number(result.retryScheduled) || 0,
      deadLetter: Number(result.deadLetter) || 0,
      avgProcessingTimeMs: 0, // Placeholder since webhookEvents doesn't have updatedAt
      retryRate: Number(retryRate.toFixed(2))
    };
  }

  /**
   * Get payment failure analysis
   */
  static async getFailureAnalysis(
    startDate: Date,
    endDate: Date = new Date()
  ) {
    const results = await db
      .select({
        failureReason: sql<string>`COALESCE(${payments.status}, 'unknown')`,
        count: count(payments.id),
        percentage: sql<number>`
          CAST(COUNT(${payments.id}) AS FLOAT) * 100 / 
          NULLIF(SUM(COUNT(${payments.id})) OVER (), 0)
        `,
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate),
          sql`${payments.status} NOT IN ('paid', 'released', 'refunded')`
        )
      )
      .groupBy(payments.status)
      .orderBy(sql`COUNT(${payments.id}) DESC`);

    return results;
  }

  /**
   * Track a payment event for analytics (to be called from payment flows)
   */
  static async trackPaymentEvent(
    eventType: string,
    paymentId: number,
    metadata: Record<string, any> = {}
  ) {
    // In a full implementation, this would write to an analytics table or external service
    // For now, we'll log it and potentially extend to use a proper analytics table
    console.log(`[Payment Analytics] Event: ${eventType}, Payment ID: ${paymentId}`, metadata);
    
    // TODO: Insert into payment_analytics_events table when created
    // await db.insert(paymentAnalyticsEvents).values({
    //   eventType,
    //   paymentId,
    //   metadata: JSON.stringify(metadata),
    //   timestamp: new Date()
    // });
  }
}

// Helper types for the analytics responses
export type SuccessRateByMethod = {
  method: string | null;
  total: number;
  successful: number;
  successRate: number;
};

export type VolumeTrend = {
  period: string;
  totalCount: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  totalAmount: number | null;
  avgAmount: number | null;
};

export type ProcessingTimeMetrics = {
  avgProcessingTimeMs: number | null;
  count: number;
};

export type PendingPayout = {
  payoutId: number;
  amount: number;
  netAmount: number;
  status: string;
  createdAt: Date;
  daysPending: number;
  userId: string;
  userEmail: string | null;
  userName: string | null;
};

export type WebhookMetrics = {
  totalWebhooks: number;
  successfulWebhooks: number;
  failedWebhooks: number;
  avgProcessingTimeMs: number;
  retryRate: number;
};

export type FailureAnalysis = {
  failureReason: string;
  count: number;
  percentage: number;
};

export type PaymentEventMetadata = Record<string, any>;