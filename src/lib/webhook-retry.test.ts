import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { BillplzPaymentWebhookResult } from "@/lib/billplz-payment";
import {
  computeRetryDelayMs,
  nextRetryCountExceedsMax,
  readRetryMeta,
  WEBHOOK_RETRY,
  WebhookRetryService,
  type ReplayWebhookFn,
  type WebhookEventRecord,
  type WebhookRetryStore,
} from "@/lib/webhook-retry";

class MemoryWebhookRetryStore implements WebhookRetryStore {
  events = new Map<number, WebhookEventRecord>();
  private lock: Promise<void> = Promise.resolve();

  private async withLock<T>(fn: () => Promise<T> | T): Promise<T> {
    let release!: () => void;
    const previous = this.lock;
    this.lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  seed(event: Partial<WebhookEventRecord> & { id: number }): WebhookEventRecord {
    const record: WebhookEventRecord = {
      event: "billplz.payment",
      payload: { id: "bill_1", paid_at: "2026-08-12 12:00:00 +0800", paid_amount: "15000" },
      status: "received",
      createdAt: new Date("2026-08-12T00:00:00.000Z"),
      ...event,
    };
    this.events.set(record.id, record);
    return record;
  }

  async getById(id: number) {
    return this.events.get(id) ?? null;
  }

  async claimForProcessing(id: number, now: Date, staleMs: number) {
    return this.withLock(() => {
      const event = this.events.get(id);
      if (!event) return null;
      const meta = readRetryMeta(event.payload);

      const dueScheduled =
        event.status === "retry_scheduled" &&
        (!meta.nextRetryAt || new Date(meta.nextRetryAt).getTime() < now.getTime());
      const staleProcessing =
        event.status === "processing" &&
        meta.claimedAt != null &&
        now.getTime() - new Date(meta.claimedAt).getTime() >= staleMs;

      if (!dueScheduled && !staleProcessing) return null;

      const updated: WebhookEventRecord = {
        ...event,
        status: "processing",
        payload: {
          ...(typeof event.payload === "object" && event.payload ? event.payload : {}),
          claimedAt: now.toISOString(),
          processingAttempts: meta.processingAttempts + 1,
        },
      };
      this.events.set(id, updated);
      return updated;
    });
  }

  async listReadyForRetry(limit: number, now: Date, staleMs: number) {
    return [...this.events.values()]
      .filter((event) => {
        const meta = readRetryMeta(event.payload);
        if (event.status === "retry_scheduled") {
          return !meta.nextRetryAt || new Date(meta.nextRetryAt).getTime() < now.getTime();
        }
        if (event.status === "processing" && meta.claimedAt) {
          return now.getTime() - new Date(meta.claimedAt).getTime() >= staleMs;
        }
        return false;
      })
      .sort((a, b) => a.id - b.id)
      .slice(0, limit);
  }

  async save(
    id: number,
    update: { status: string; payload: unknown },
    expectedStatuses?: string[],
  ) {
    return this.withLock(() => {
      const event = this.events.get(id);
      if (!event) return null;
      if (expectedStatuses && !expectedStatuses.includes(event.status ?? "")) return null;
      const updated = { ...event, status: update.status, payload: update.payload };
      this.events.set(id, updated);
      return updated;
    });
  }

  async listByStatus(status: string, limit: number) {
    return [...this.events.values()]
      .filter((event) => event.status === status)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit);
  }

  async countByStatus(status: string) {
    return [...this.events.values()].filter((event) => event.status === status).length;
  }
}

function readyEvent(store: MemoryWebhookRetryStore, id = 1) {
  return store.seed({
    id,
    status: "retry_scheduled",
    payload: {
      id: "bill_1",
      paid_at: "2026-08-12 12:00:00 +0800",
      paid_amount: "15000",
      retryCount: 1,
      nextRetryAt: "2026-08-12T00:00:00.000Z",
    },
  });
}

function processedResult(): BillplzPaymentWebhookResult {
  return {
    status: "processed",
    paymentId: 20,
    bookingId: 10,
    kind: "deposit",
    transitioned: true,
  };
}

describe("webhook retry helpers", () => {
  it("uses exponential backoff plus jitter", () => {
    assert.equal(computeRetryDelayMs(1, 0), 1000);
    assert.equal(computeRetryDelayMs(2, 0), 2000);
    assert.equal(computeRetryDelayMs(3, 0), 4000);
    assert.equal(computeRetryDelayMs(2, 250), 2250);
  });

  it("moves to dead letter on the attempt that reaches MAX_RETRIES", () => {
    assert.equal(nextRetryCountExceedsMax(0), false);
    assert.equal(nextRetryCountExceedsMax(1), false);
    assert.equal(nextRetryCountExceedsMax(2), true);
    assert.equal(WEBHOOK_RETRY.MAX_RETRIES, 3);
  });
});

describe("WebhookRetryService", () => {
  it("enqueues a webhook for retry", async () => {
    const store = new MemoryWebhookRetryStore();
    store.seed({ id: 1, status: "received", payload: { id: "bill_1" } });
    const service = new WebhookRetryService(store, async () => processedResult(), () => 0);

    const queued = await service.enqueueForRetry(1, "Test error");
    const event = await store.getById(1);
    const meta = readRetryMeta(event?.payload);

    assert.equal(queued, "retry_scheduled");
    assert.equal(event?.status, "retry_scheduled");
    assert.equal(meta.retryCount, 1);
    assert.equal(meta.lastError, "Test error");
    assert.ok(meta.nextRetryAt);
    assert.equal(meta.attemptLog.length, 1);
  });

  it("moves to dead letter after max retries", async () => {
    const store = new MemoryWebhookRetryStore();
    store.seed({
      id: 1,
      status: "retry_scheduled",
      payload: { id: "bill_1", retryCount: 2 },
    });
    const service = new WebhookRetryService(store, async () => processedResult(), () => 0);

    const queued = await service.enqueueForRetry(1, "still failing");
    const event = await store.getById(1);

    assert.equal(queued, "dead_letter");
    assert.equal(event?.status, "dead_letter");
    assert.equal(readRetryMeta(event?.payload).retryCount, 3);
    assert.ok(readRetryMeta(event?.payload).movedToDeadLetterAt);
  });

  it("lists events whose next retry time is in the past", async () => {
    const store = new MemoryWebhookRetryStore();
    store.seed({
      id: 1,
      status: "retry_scheduled",
      payload: { id: "bill_1", retryCount: 1, nextRetryAt: "2020-01-01T00:00:00.000Z" },
    });
    store.seed({
      id: 2,
      status: "retry_scheduled",
      payload: { id: "bill_2", retryCount: 1, nextRetryAt: "2099-01-01T00:00:00.000Z" },
    });
    const service = new WebhookRetryService(
      store,
      async () => processedResult(),
      () => 0,
      () => new Date("2026-08-12T00:00:00.000Z"),
    );

    const ready = await service.getReadyForRetry(10);
    assert.deepEqual(ready.map((event) => event.id), [1]);
  });

  it("replays the real processor and marks processed only after success", async () => {
    const store = new MemoryWebhookRetryStore();
    readyEvent(store);
    const payloads: unknown[] = [];
    const replay: ReplayWebhookFn = async (payload) => {
      payloads.push(payload);
      return processedResult();
    };
    const service = new WebhookRetryService(store, replay, () => 0);

    const result = await service.processRetry(1);
    const event = await store.getById(1);

    assert.equal(result.status, "processed");
    assert.equal(event?.status, "processed");
    assert.equal(payloads.length, 1);
    assert.equal(readRetryMeta(event?.payload).retrySuccess, true);
    assert.equal(readRetryMeta(event?.payload).replayStatus, "processed");
  });

  it("never marks processed when replay fails, even across many attempts", async () => {
    for (let i = 0; i < 20; i++) {
      const store = new MemoryWebhookRetryStore();
      readyEvent(store);
      const service = new WebhookRetryService(
        store,
        async () => ({ status: "error", error: "database unavailable" }),
        () => 0,
      );

      const result = await service.processRetry(1);
      const event = await store.getById(1);

      assert.equal(result.status, "requeued");
      assert.notEqual(event?.status, "processed");
      assert.equal(event?.status, "retry_scheduled");
      assert.equal(readRetryMeta(event?.payload).lastError, "database unavailable");
    }
  });

  it("requeues missing payments with the actual error and records the attempt", async () => {
    const store = new MemoryWebhookRetryStore();
    readyEvent(store);
    const service = new WebhookRetryService(
      store,
      async () => ({ status: "no_payment", billplzId: "bill_1" }),
      () => 0,
    );

    const result = await service.processRetry(1);
    const event = await store.getById(1);
    const meta = readRetryMeta(event?.payload);

    assert.equal(result.status, "requeued");
    assert.equal(event?.status, "retry_scheduled");
    assert.match(meta.lastError ?? "", /No local payment for Billplz bill bill_1/);
    assert.ok(meta.attemptLog.some((entry) => entry.error?.includes("bill_1")));
    assert.equal(meta.retryCount, 2);
  });

  it("treats amount mismatches as terminal and does not randomly succeed", async () => {
    const store = new MemoryWebhookRetryStore();
    readyEvent(store);
    const service = new WebhookRetryService(
      store,
      async () => ({
        status: "amount_mismatch",
        paymentId: 20,
        webhookAmount: 14000,
        localAmount: 15000,
      }),
      () => 0,
    );

    const result = await service.processRetry(1);
    const event = await store.getById(1);

    assert.equal(result.status, "terminal");
    assert.equal(event?.status, "mismatch");
    assert.match(readRetryMeta(event?.payload).lastError ?? "", /Amount mismatch/);
  });

  it("lets only one concurrent worker claim and process the same event", async () => {
    const store = new MemoryWebhookRetryStore();
    readyEvent(store);

    let inFlight = 0;
    let maxInFlight = 0;
    let processed = 0;

    const replay: ReplayWebhookFn = async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 40));
      inFlight -= 1;
      processed += 1;
      return processedResult();
    };

    const workerA = new WebhookRetryService(store, replay, () => 0);
    const workerB = new WebhookRetryService(store, replay, () => 0);

    const [first, second] = await Promise.all([
      workerA.processRetry(1),
      workerB.processRetry(1),
    ]);

    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, ["processed", "skipped"]);
    assert.equal(processed, 1);
    assert.equal(maxInFlight, 1);
    assert.equal((await store.getById(1))?.status, "processed");
  });

  it("reclaims a stale processing event", async () => {
    const store = new MemoryWebhookRetryStore();
    store.seed({
      id: 1,
      status: "processing",
      payload: {
        id: "bill_1",
        paid_at: "2026-08-12 12:00:00 +0800",
        claimedAt: "2026-08-12T00:00:00.000Z",
        retryCount: 1,
        processingAttempts: 1,
      },
    });

    const now = new Date(
      new Date("2026-08-12T00:00:00.000Z").getTime() + WEBHOOK_RETRY.CLAIM_STALE_MS + 1,
    );
    const service = new WebhookRetryService(store, async () => processedResult(), () => 0, () => now);

    const result = await service.processRetry(1);
    assert.equal(result.status, "processed");
    assert.equal((await store.getById(1))?.status, "processed");
    assert.equal(readRetryMeta((await store.getById(1))?.payload).processingAttempts, 2);
  });

  it("moves a dead-letter event back onto the retry queue", async () => {
    const store = new MemoryWebhookRetryStore();
    store.seed({
      id: 1,
      status: "dead_letter",
      payload: { id: "bill_1", retryCount: 3, lastError: "gave up" },
    });
    const service = new WebhookRetryService(store, async () => processedResult(), () => 0);

    assert.equal(await service.manualRetryDeadLetter(1), true);
    const event = await store.getById(1);
    assert.equal(event?.status, "retry_scheduled");
    assert.equal(readRetryMeta(event?.payload).retryCount, 0);
  });
});
