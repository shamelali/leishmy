import { randomInt } from "node:crypto";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import {
  asPayloadRecord,
  describeWebhookResult,
  isRetryableWebhookResult,
  isSuccessfulWebhookReplay,
  type BillplzPaymentWebhookResult,
} from "@/lib/billplz-payment";
import { and, asc, eq, inArray, or, sql } from "drizzle-orm";

export const WEBHOOK_RETRY = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  CLAIM_STALE_MS: 2 * 60 * 1000,
} as const;

export type WebhookEventRecord = typeof webhookEvents.$inferSelect;

export type WebhookAttemptLogEntry = {
  at: string;
  error?: string;
  result?: string;
  retryCount?: number;
};

export type ProcessRetryResult = {
  status: "processed" | "requeued" | "dead_letter" | "skipped" | "terminal";
  error?: string;
  replayStatus?: string;
};

export type ReplayWebhookFn = (payload: unknown) => Promise<BillplzPaymentWebhookResult>;

export interface WebhookRetryStore {
  getById(id: number): Promise<WebhookEventRecord | null>;
  claimForProcessing(
    id: number,
    now: Date,
    staleMs: number,
  ): Promise<WebhookEventRecord | null>;
  listReadyForRetry(
    limit: number,
    now: Date,
    staleMs: number,
  ): Promise<WebhookEventRecord[]>;
  save(
    id: number,
    update: { status: string; payload: unknown },
    expectedStatuses?: string[],
  ): Promise<WebhookEventRecord | null>;
  listByStatus(status: string, limit: number): Promise<WebhookEventRecord[]>;
  countByStatus(status: string): Promise<number>;
}

type RetryMeta = {
  retryCount: number;
  processingAttempts: number;
  lastError?: string;
  lastRetryAttempt?: string;
  nextRetryAt?: string;
  claimedAt?: string;
  processedAt?: string;
  retrySuccess?: boolean;
  movedToDeadLetterAt?: string;
  replayStatus?: string;
  attemptLog: WebhookAttemptLogEntry[];
};

export function readRetryMeta(payload: unknown): RetryMeta {
  const record = asPayloadRecord(payload);
  const retryCount = Number(record.retryCount);
  const processingAttempts = Number(record.processingAttempts);
  const attemptLog = Array.isArray(record.attemptLog)
    ? (record.attemptLog as WebhookAttemptLogEntry[]).filter(
        (entry) => entry && typeof entry === "object",
      )
    : [];

  return {
    retryCount: Number.isFinite(retryCount) ? retryCount : 0,
    processingAttempts: Number.isFinite(processingAttempts) ? processingAttempts : 0,
    lastError: typeof record.lastError === "string" ? record.lastError : undefined,
    lastRetryAttempt:
      typeof record.lastRetryAttempt === "string" ? record.lastRetryAttempt : undefined,
    nextRetryAt: typeof record.nextRetryAt === "string" ? record.nextRetryAt : undefined,
    claimedAt: typeof record.claimedAt === "string" ? record.claimedAt : undefined,
    processedAt: typeof record.processedAt === "string" ? record.processedAt : undefined,
    retrySuccess: record.retrySuccess === true,
    movedToDeadLetterAt:
      typeof record.movedToDeadLetterAt === "string"
        ? record.movedToDeadLetterAt
        : undefined,
    replayStatus: typeof record.replayStatus === "string" ? record.replayStatus : undefined,
    attemptLog,
  };
}

export function mergeRetryMeta(
  payload: unknown,
  meta: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...asPayloadRecord(payload),
    ...meta,
  };
}

export function computeRetryDelayMs(retryCount: number, jitterMs: number): number {
  const baseDelay = WEBHOOK_RETRY.BASE_DELAY_MS * Math.pow(2, Math.max(retryCount, 1) - 1);
  return baseDelay + Math.max(0, jitterMs);
}

export function nextRetryCountExceedsMax(
  currentRetryCount: number,
  maxRetries = WEBHOOK_RETRY.MAX_RETRIES,
): boolean {
  return currentRetryCount + 1 >= maxRetries;
}

function appendAttemptLog(
  payload: unknown,
  entry: WebhookAttemptLogEntry,
): WebhookAttemptLogEntry[] {
  return [...readRetryMeta(payload).attemptLog, entry].slice(-10);
}

export class PostgresWebhookRetryStore implements WebhookRetryStore {
  async getById(id: number): Promise<WebhookEventRecord | null> {
    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, id))
      .limit(1);
    return event ?? null;
  }

  async claimForProcessing(
    id: number,
    now: Date,
    staleMs: number,
  ): Promise<WebhookEventRecord | null> {
    const nowIso = now.toISOString();
    const staleIso = new Date(now.getTime() - staleMs).toISOString();

    const [claimed] = await db
      .update(webhookEvents)
      .set({
        status: "processing",
        payload: sql`
          COALESCE(${webhookEvents.payload}, '{}'::jsonb)
          || jsonb_build_object(
            'claimedAt', ${nowIso}::text,
            'processingAttempts',
              COALESCE((${webhookEvents.payload}->>'processingAttempts')::int, 0) + 1
          )
        `,
      })
      .where(
        and(
          eq(webhookEvents.id, id),
          or(
            and(
              eq(webhookEvents.status, "retry_scheduled"),
              sql`COALESCE(${webhookEvents.payload}->>'nextRetryAt', '1970-01-01T00:00:00.000Z') < ${nowIso}`,
            ),
            and(
              eq(webhookEvents.status, "processing"),
              sql`COALESCE(${webhookEvents.payload}->>'claimedAt', '1970-01-01T00:00:00.000Z') < ${staleIso}`,
            ),
          ),
        ),
      )
      .returning();

    return claimed ?? null;
  }

  async listReadyForRetry(
    limit: number,
    now: Date,
    staleMs: number,
  ): Promise<WebhookEventRecord[]> {
    const nowIso = now.toISOString();
    const staleIso = new Date(now.getTime() - staleMs).toISOString();

    return db
      .select()
      .from(webhookEvents)
      .where(
        or(
          and(
            eq(webhookEvents.status, "retry_scheduled"),
            sql`COALESCE(${webhookEvents.payload}->>'nextRetryAt', '1970-01-01T00:00:00.000Z') < ${nowIso}`,
          ),
          and(
            eq(webhookEvents.status, "processing"),
            sql`COALESCE(${webhookEvents.payload}->>'claimedAt', '1970-01-01T00:00:00.000Z') < ${staleIso}`,
          ),
        ),
      )
      .orderBy(asc(webhookEvents.id))
      .limit(limit);
  }

  async save(
    id: number,
    update: { status: string; payload: unknown },
    expectedStatuses?: string[],
  ): Promise<WebhookEventRecord | null> {
    const [updated] = await db
      .update(webhookEvents)
      .set({
        status: update.status,
        payload: update.payload,
      })
      .where(
        expectedStatuses && expectedStatuses.length > 0
          ? and(eq(webhookEvents.id, id), inArray(webhookEvents.status, expectedStatuses))
          : eq(webhookEvents.id, id),
      )
      .returning();
    return updated ?? null;
  }

  async listByStatus(status: string, limit: number): Promise<WebhookEventRecord[]> {
    return db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, status))
      .orderBy(asc(webhookEvents.createdAt))
      .limit(limit);
  }

  async countByStatus(status: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookEvents)
      .where(eq(webhookEvents.status, status));
    return Number(result?.count ?? 0);
  }
}

const defaultReplay: ReplayWebhookFn = async (payload) => {
  const { processBillplzPaymentWebhook } = await import("@/lib/billplz-payment-webhook");
  return processBillplzPaymentWebhook(payload);
};

export class WebhookRetryService {
  static MAX_RETRIES = WEBHOOK_RETRY.MAX_RETRIES;
  static BASE_DELAY_MS = WEBHOOK_RETRY.BASE_DELAY_MS;

  constructor(
    private readonly store: WebhookRetryStore = new PostgresWebhookRetryStore(),
    private readonly replay: ReplayWebhookFn = defaultReplay,
    private readonly jitterMs: () => number = () => randomInt(1000),
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Enqueue a webhook event for retry processing.
   * After MAX_RETRIES failed attempts the event is moved to the dead-letter queue.
   */
  async enqueueForRetry(
    eventId: number,
    error: string,
  ): Promise<"retry_scheduled" | "dead_letter" | "missing"> {
    const event = await this.store.getById(eventId);
    if (!event) {
      console.error(`[WebhookRetry] Event ${eventId} not found for retry`);
      return "missing";
    }

    if (event.status === "processed" || event.status === "mismatch") {
      return event.status === "processed" ? "missing" : "dead_letter";
    }

    const now = this.now();
    const currentRetryCount = readRetryMeta(event.payload).retryCount;
    const newRetryCount = currentRetryCount + 1;
    const attemptLog = appendAttemptLog(event.payload, {
      at: now.toISOString(),
      error,
      retryCount: newRetryCount,
    });

    if (newRetryCount >= WebhookRetryService.MAX_RETRIES) {
      const saved = await this.store.save(
        eventId,
        {
          status: "dead_letter",
          payload: mergeRetryMeta(event.payload, {
            retryCount: newRetryCount,
            lastError: error,
            lastRetryAttempt: now.toISOString(),
            movedToDeadLetterAt: now.toISOString(),
            claimedAt: null,
            attemptLog,
          }),
        },
        ["received", "processing", "retry_scheduled", "dead_letter"],
      );

      console.error(
        `[WebhookRetry] Event ${eventId} moved to dead letter queue after ${newRetryCount} retries`,
      );
      return saved ? "dead_letter" : "missing";
    }

    const delayMs = computeRetryDelayMs(newRetryCount, this.jitterMs());
    const nextRetryAt = new Date(now.getTime() + delayMs).toISOString();

    const saved = await this.store.save(
      eventId,
      {
        status: "retry_scheduled",
        payload: mergeRetryMeta(event.payload, {
          retryCount: newRetryCount,
          lastError: error,
          lastRetryAttempt: now.toISOString(),
          nextRetryAt,
          claimedAt: null,
          attemptLog,
        }),
      },
      ["received", "processing", "retry_scheduled"],
    );

    if (!saved) return "missing";

    console.log(
      `[WebhookRetry] Event ${eventId} scheduled for retry ${newRetryCount}/${WebhookRetryService.MAX_RETRIES} in ${delayMs}ms`,
    );
    return "retry_scheduled";
  }

  async getReadyForRetry(limit = 10): Promise<WebhookEventRecord[]> {
    return this.store.listReadyForRetry(limit, this.now(), WEBHOOK_RETRY.CLAIM_STALE_MS);
  }

  /**
   * Replay a scheduled webhook using the real Billplz payment processor.
   * The event is claimed atomically so concurrent workers cannot both process it.
   * It is marked processed only after replay reports a successful financial outcome.
   */
  async processRetry(eventId: number): Promise<ProcessRetryResult> {
    const claimed = await this.store.claimForProcessing(
      eventId,
      this.now(),
      WEBHOOK_RETRY.CLAIM_STALE_MS,
    );

    if (!claimed) {
      const existing = await this.store.getById(eventId);
      console.log(
        `[WebhookRetry] Event ${eventId} is not claimable (status: ${existing?.status ?? "missing"})`,
      );
      return { status: "skipped", replayStatus: existing?.status ?? "missing" };
    }

    try {
      const result = await this.replay(claimed.payload);

      if (isSuccessfulWebhookReplay(result)) {
        const marked = await this.finalizeEvent(claimed.id, "processed", {
          processedAt: this.now().toISOString(),
          retrySuccess: true,
          replayStatus: result.status,
          lastError: null,
          claimedAt: null,
          attemptLog: appendAttemptLog(claimed.payload, {
            at: this.now().toISOString(),
            result: result.status,
            retryCount: readRetryMeta(claimed.payload).retryCount,
          }),
        }, ["processing"]);

        if (!marked) {
          throw new Error("Failed to mark webhook event processed after successful replay");
        }

        console.log(
          `[WebhookRetry] Event ${eventId} processed successfully on retry (${result.status})`,
        );
        return { status: "processed", replayStatus: result.status };
      }

      if (!isRetryableWebhookResult(result)) {
        const status = result.status === "amount_mismatch" ? "mismatch" : "dead_letter";
        await this.finalizeEvent(claimed.id, status, {
          lastError: describeWebhookResult(result),
          lastRetryAttempt: this.now().toISOString(),
          replayStatus: result.status,
          claimedAt: null,
          attemptLog: appendAttemptLog(claimed.payload, {
            at: this.now().toISOString(),
            error: describeWebhookResult(result),
            result: result.status,
            retryCount: readRetryMeta(claimed.payload).retryCount,
          }),
        }, ["processing"]);
        return {
          status: "terminal",
          error: describeWebhookResult(result),
          replayStatus: result.status,
        };
      }

      const queued = await this.enqueueForRetry(eventId, describeWebhookResult(result));
      return {
        status: queued === "dead_letter" ? "dead_letter" : "requeued",
        error: describeWebhookResult(result),
        replayStatus: result.status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const queued = await this.enqueueForRetry(eventId, `Unexpected error: ${message}`);
      return {
        status: queued === "dead_letter" ? "dead_letter" : "requeued",
        error: message,
      };
    }
  }

  async finalizeEvent(
    eventId: number,
    status: string,
    extra: Record<string, unknown>,
    expectedStatuses?: string[],
  ): Promise<WebhookEventRecord | null> {
    const event = await this.store.getById(eventId);
    if (!event) return null;
    return this.store.save(
      eventId,
      {
        status,
        payload: mergeRetryMeta(event.payload, extra),
      },
      expectedStatuses,
    );
  }

  async getDeadLetterEvents(limit = 50): Promise<WebhookEventRecord[]> {
    return this.store.listByStatus("dead_letter", limit);
  }

  async getDeadLetterCount(): Promise<number> {
    return this.store.countByStatus("dead_letter");
  }

  async getRetryScheduledCount(): Promise<number> {
    return this.store.countByStatus("retry_scheduled");
  }

  async manualRetryDeadLetter(eventId: number): Promise<boolean> {
    const event = await this.store.getById(eventId);
    if (!event) {
      console.error(`[WebhookRetry] Dead letter event ${eventId} not found`);
      return false;
    }

    if (event.status !== "dead_letter") {
      console.error(`[WebhookRetry] Event ${eventId} is not in dead letter status`);
      return false;
    }

    const now = this.now();
    const delayMs = computeRetryDelayMs(1, this.jitterMs());
    const nextRetryAt = new Date(now.getTime() + delayMs).toISOString();

    const saved = await this.store.save(
      eventId,
      {
        status: "retry_scheduled",
        payload: mergeRetryMeta(event.payload, {
          retryCount: 0,
          lastError: "Manually moved from dead letter queue",
          lastRetryAttempt: now.toISOString(),
          nextRetryAt,
          claimedAt: null,
          movedToDeadLetterAt: null,
        }),
      },
      ["dead_letter"],
    );

    if (!saved) return false;
    console.log(`[WebhookRetry] Dead letter event ${eventId} moved to retry queue`);
    return true;
  }

  private static defaultInstance: WebhookRetryService | undefined;

  private static get default(): WebhookRetryService {
    if (!this.defaultInstance) {
      this.defaultInstance = new WebhookRetryService();
    }
    return this.defaultInstance;
  }

  static enqueueForRetry(eventId: number, error: string) {
    return this.default.enqueueForRetry(eventId, error);
  }

  static getReadyForRetry(limit = 10) {
    return this.default.getReadyForRetry(limit);
  }

  static processRetry(eventId: number) {
    return this.default.processRetry(eventId);
  }

  static getDeadLetterEvents(limit = 50) {
    return this.default.getDeadLetterEvents(limit);
  }

  static getDeadLetterCount() {
    return this.default.getDeadLetterCount();
  }

  static getRetryScheduledCount() {
    return this.default.getRetryScheduledCount();
  }

  static manualRetryDeadLetter(eventId: number) {
    return this.default.manualRetryDeadLetter(eventId);
  }

  static finalizeEvent(
    eventId: number,
    status: string,
    extra: Record<string, unknown>,
    expectedStatuses?: string[],
  ) {
    return this.default.finalizeEvent(eventId, status, extra, expectedStatuses);
  }
}
