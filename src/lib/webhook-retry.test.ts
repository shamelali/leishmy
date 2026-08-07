import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { WebhookRetryService } from "@/lib/webhook-retry";
import { eq } from "drizzle-orm";

describe("WebhookRetryService", () => {
  let testEventId: number;

  beforeAll(async () => {
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

  afterAll(async () => {
    // Clean up test event
    await db.delete(webhookEvents).where(eq(webhookEvents.id, testEventId));
  });

  test("should enqueue webhook for retry", async () => {
    await WebhookRetryService.enqueueForRetry(testEventId, "Test error");

    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, testEventId))
      .limit(1);

    expect(event).toBeDefined();
    expect(event?.status).toBe("retry_scheduled");
    expect((event?.payload as any)?.retryCount).toBe(1);
  });

  test("should move to dead letter after max retries", async () => {
    // Manually set retry count to 2 (one away from max)
    await db
      .update(webhookEvents)
      .set({
        payload: {
          ...(typeof (await db.select().from(webhookEvents).where(eq(webhookEvents.id, testEventId)).limit(1)).then(res => res[0]?.payload || {}) as object),
          retryCount: 2
        }
      })
      .where(eq(webhookEvents.id, testEventId));

    await WebhookRetryService.enqueueForRetry(testEventId, "Test error");

    const [event] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, testEventId))
      .limit(1);

    expect(event).toBeDefined();
    expect(event?.status).toBe("dead_letter");
    expect((event?.payload as any)?.retryCount).toBe(3);
  });

  test("should get ready for retry", async () => {
    // Reset event for retry test
    await db
      .update(webhookEvents)
      .set({
        status: "retry_scheduled",
        payload: {
          test: "data",
          retryCount: 0,
          nextRetryAt: new Date(Date.now() - 10000).toISOString() // Past time
        }
      })
      .where(eq(webhookEvents.id, testEventId));

    const readyEvents = await WebhookRetryService.getReadyForRetry(10);
    expect(readyEvents.length).toBeGreaterThan(0);
    expect(readyEvents[0]?.id).toBe(testEventId);
  });
});