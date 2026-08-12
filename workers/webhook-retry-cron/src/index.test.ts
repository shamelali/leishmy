import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { invokeWebhookRetryProcessor } from "./index";

const env = {
  APP_URL: "https://leish.my",
  CRON_SECRET: "test-cron-secret",
};

describe("invokeWebhookRetryProcessor", () => {
  it("posts to the retry endpoint with header authentication", async () => {
    let requestedUrl = "";
    let requestedMethod = "";
    let requestedSecret = "";

    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = input.toString();
      requestedMethod = init?.method ?? "";
      requestedSecret = new Headers(init?.headers).get("x-cron-secret") ?? "";
      return new Response(null, { status: 200 });
    }) as typeof fetch;

    const status = await invokeWebhookRetryProcessor(env, fetcher);

    assert.equal(status, 200);
    assert.equal(
      requestedUrl,
      "https://leish.my/api/cron/process-webhook-retries",
    );
    assert.equal(requestedMethod, "POST");
    assert.equal(requestedSecret, env.CRON_SECRET);
    assert.ok(!requestedUrl.includes(env.CRON_SECRET));
  });

  it("rejects non-success responses", async () => {
    const fetcher = (async () =>
      new Response(null, { status: 503 })) as typeof fetch;

    await assert.rejects(
      invokeWebhookRetryProcessor(env, fetcher),
      /returned HTTP 503/,
    );
  });

  it("requires a configured cron secret", async () => {
    await assert.rejects(
      invokeWebhookRetryProcessor({ ...env, CRON_SECRET: "" }),
      /CRON_SECRET is not configured/,
    );
  });

  it("requires APP_URL to be configured", async () => {
    await assert.rejects(
      invokeWebhookRetryProcessor({ ...env, APP_URL: "" }),
      /APP_URL is not configured/,
    );
  });

  it("rejects insecure non-local destinations", async () => {
    await assert.rejects(
      invokeWebhookRetryProcessor({
        ...env,
        APP_URL: "http://example.com",
      }),
      /APP_URL must use HTTPS/,
    );
  });
});
