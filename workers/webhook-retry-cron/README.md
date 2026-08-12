# Webhook Retry Cron Worker

Cloudflare Worker that invokes Leish's webhook retry processor every 15 minutes. It has no public HTTP route; Cloudflare Cron Triggers are its only production entry point.

## Schedule and request

- Cron: `*/15 * * * *` (UTC)
- Destination: `https://leish.my/api/cron/process-webhook-retries`
- Method: `POST`
- Authentication: `x-cron-secret` header

A non-2xx response fails the Worker invocation and appears in Cloudflare observability. The next scheduled invocation provides the retry; the Worker deliberately avoids immediate transport retries that could process the same queue entries concurrently.

## Configure and deploy

Run these commands from the repository root:

```bash
pnpm exec wrangler login
pnpm exec wrangler secret put CRON_SECRET \
  --config workers/webhook-retry-cron/wrangler.jsonc
pnpm exec wrangler deploy \
  --config workers/webhook-retry-cron/wrangler.jsonc
```

When prompted by `wrangler secret put`, enter the same `CRON_SECRET` configured on the production Leish deployment. Never add its value to `wrangler.jsonc`, a command-line argument, or Git.

The Wrangler configuration declares `CRON_SECRET` as required, so deployment fails closed when the Worker secret has not been configured.

## Local scheduled-event test

1. Create `workers/webhook-retry-cron/.dev.vars` containing a local cron secret:

   ```dotenv
   CRON_SECRET=your-local-cron-secret
   ```

2. Start Leish locally with the same `CRON_SECRET` and the required database configuration.
3. Start Wrangler with a local destination override:

   ```bash
   pnpm exec wrangler dev --test-scheduled \
     --config workers/webhook-retry-cron/wrangler.jsonc \
     --var APP_URL:http://localhost:3000
   ```

4. Trigger the scheduled handler:

   ```bash
   curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
   ```

`.dev.vars` files are ignored by Git and must never be committed.

## Operations

- View executions under **Cloudflare Dashboard → Workers & Pages → leish-webhook-retry-cron → Observability**.
- HTTP 401 means the Worker and Leish deployment have different `CRON_SECRET` values.
- HTTP 503 means `CRON_SECRET` is absent from the Leish deployment.
- Keep the daily Vercel cron as a fallback, but do not activate GitHub Actions or QStash for the same 15-minute schedule unless duplicate invocations are intentional.
