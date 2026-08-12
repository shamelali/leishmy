# Webhook Retry Scheduling

`GET` or `POST` requests to `/api/cron/process-webhook-retries` process up to 20 scheduled webhook retries per invocation. External schedulers authenticate with the production `CRON_SECRET` in the `x-cron-secret` header; Vercel Cron uses the equivalent `Authorization: Bearer <CRON_SECRET>` header.

## Preferred high-frequency scheduler: Cloudflare Workers

The Worker in `workers/webhook-retry-cron` invokes the endpoint every 15 minutes using a Cloudflare Cron Trigger. Its `CRON_SECRET` is stored as an encrypted Worker secret, and the Worker has no public HTTP route.

See `workers/webhook-retry-cron/README.md` for deployment, local testing, observability, and troubleshooting instructions.

## Vercel Hobby fallback

The entry in `vercel.json` runs once daily at 04:00 UTC. This stays within Vercel Hobby's daily cron frequency restriction and provides a fallback if the Cloudflare schedule is unavailable.

## Optional alternatives

Do not activate GitHub Actions or QStash while the Cloudflare 15-minute trigger is active unless duplicate invocations are intentional.

### GitHub Actions

A ready-to-use workflow is stored at `docs/examples/cron-retries.yml`. A repository administrator with Actions workflow permission can activate it with:

```bash
mkdir -p .github/workflows
cp docs/examples/cron-retries.yml .github/workflows/cron-retries.yml
```

Once activated, it runs every 15 minutes and can also be invoked manually. Add these repository secrets under **Settings → Secrets and variables → Actions**:

- `APP_URL`: the deployment origin, for example `https://leish.my`
- `CRON_SECRET`: the same value configured for the deployment

The workflow fails closed when either secret is absent and does not place the secret in the request URL.

### Upstash QStash

Create a QStash schedule with these settings:

- **Destination:** `https://leish.my/api/cron/process-webhook-retries`
- **Method:** `POST`
- **Cron expression:** `*/15 * * * *`
- **Forwarded header:** `x-cron-secret: <the production CRON_SECRET>`

When creating the schedule through the QStash API rather than the dashboard, send the secret as the `Upstash-Forward-x-cron-secret` publish header so QStash forwards it to the destination. Keep both the QStash token and cron secret in the scheduler's secret store; never add either value to the destination URL or repository.

## Verification

1. Deploy the Cloudflare Worker and trigger a scheduled test as described in its README.
2. Confirm the Worker invocation succeeds and the endpoint returns HTTP 200.
3. Check the admin webhook retry dashboard and cron-run records for the corresponding execution.
4. An HTTP 401 means the scheduler and deployment use different `CRON_SECRET` values; HTTP 503 means the deployment does not have `CRON_SECRET` configured.
