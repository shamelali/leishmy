import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { eq } from "drizzle-orm";

describe("WebhookRetryService", () => {
  let testEventId: number;

  before(async () => {
    // Create a test webhook event
    const [event] = await db
      .insert(webhookEvents)
      .values({
        event: "test.webhook",
        payload: { test: "data" },
        status: "received",
      })
      .returning({ id: webhookEvents.id });

    testEventId = event.id;
  });

  after(async () => {
    // Clean up test event
    if (testEventId) {
      await db.delete(webhookEvents).where(eq(webhookEvents.id, testEventId));
    }
  });

  it("should enqueue webhook for retry", async () => {
    await WebhookRetryService.enqueueForRetry(testEventId, "Test error");

    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, testEventId))
      .limit(1);

    assert.ok(event);
    assert.equal(event.status, "retry_scheduled");
    assert.equal((event.payload as { retryCount?: number })?.retryCount, 1);
  });

  it("should move to dead letter after max retries", async () => {
    const [currentEvent] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, testEventId))
      .limit(1);

    const currentPayload =
      typeof currentEvent?.payload === "object" && currentEvent?.payload !== null
        ? currentEvent.payload
        : {};

    // Manually set retry count to 2 (one away from max)
    await db
      .update(webhookEvents)
      .set({
        payload: {
          ...currentPayload,
          retryCount: 2,
        },
      })
      .where(eq(webhookEvents.id, testEventId));

    await WebhookRetryService.enqueueForRetry(testEventId, "Test error");

    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, testEventId))
      .limit(1);

    assert.ok(event);
    assert.equal(event.status, "dead_letter");
    assert.equal((event.payload as { retryCount?: number })?.retryCount, 3);
  });

  it("should get ready for retry", async () => {
    // Reset event for retry test
    await db
      .update(webhookEvents)
      .set({
        status: "retry_scheduled",
        payload: {
          test: "data",
          retryCount: 0,
          nextRetryAt: new Date(Date.now() - 10000).toISOString(), // Past time
        },
      })
      .where(eq(webhookEvents.id, testEventId));

    const readyEvents = await WebhookRetryService.getReadyForRetry(10);
    assert.ok(readyEvents.length > 0);
    assert.equal(readyEvents[0]?.id, testEventId);
  });
});
