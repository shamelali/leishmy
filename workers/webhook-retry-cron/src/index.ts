export interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

const RETRY_PATH = "/api/cron/process-webhook-retries";

function retryEndpoint(appUrl: string): string {
  const baseUrl = new URL(appUrl);
  const isLocalDevelopment =
    baseUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(baseUrl.hostname);
  if (baseUrl.protocol !== "https:" && !isLocalDevelopment) {
    throw new Error("APP_URL must use HTTPS outside local development");
  }
  if (baseUrl.username || baseUrl.password) {
    throw new Error("APP_URL must not contain credentials");
  }

  return new URL(RETRY_PATH, baseUrl).toString();
}

export async function invokeWebhookRetryProcessor(
  env: Env,
  fetcher: typeof fetch = fetch,
): Promise<number> {
  if (!env.CRON_SECRET) {
    throw new Error("CRON_SECRET is not configured");
  }

  const response = await fetcher(retryEndpoint(env.APP_URL), {
    method: "POST",
    headers: {
      "x-cron-secret": env.CRON_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Webhook retry processor returned HTTP ${response.status}`,
    );
  }

  return response.status;
}

const worker = {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    const status = await invokeWebhookRetryProcessor(env);
    console.log(
      JSON.stringify({
        event: "webhook_retry_cron_completed",
        cron: controller.cron,
        scheduledTime: new Date(controller.scheduledTime).toISOString(),
        status,
      }),
    );
  },
};

export default worker;
