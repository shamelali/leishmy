# Production Release Checklist

Use this checklist for every production deployment. The release owner records the deployment URL, migration status, payment-smoke-test result, and rollback decision in the release ticket.

## Before merging

- [ ] Preview deployment is healthy and the public Playwright smoke suite passes.
- [ ] `pnpm check` and `pnpm build` pass from the release commit.
- [ ] Any new migration has been applied successfully to a Neon preview branch.
- [ ] A rollback owner is named and has Vercel and Neon access.
- [ ] Required production variables are present: Neon Auth, Billplz, Cloudinary, Brevo, CRON secret, and Upstash rate-limit credentials.

## Before production deploy

- [ ] Review the migration for locking, reversibility, and data backfill requirements.
- [ ] Take or confirm a recoverable Neon restore point; record its timestamp in the release ticket.
- [ ] Confirm Billplz callbacks use `https://leish.my/api/webhook` and that the production signature key is configured.
- [ ] Confirm `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set and newly added public images resolve from Cloudinary.
- [ ] Announce the release window and rollback owner in the operations channel.

## Deploy and verify

- [ ] Deploy the release and confirm the Vercel production deployment is ready.
- [ ] Run `pnpm db:migrate` against production only when the migration was not applied by the deployment process; record the result.
- [ ] Smoke-test sign-in, artist/studio discovery, booking creation, quote acceptance, and a Billplz test/low-value payment as appropriate for the environment.
- [ ] Confirm the Billplz webhook is accepted and the payment, booking, invoice, and notification state update exactly once.
- [ ] Check Sentry, Vercel logs, and the admin monitoring endpoint for errors for at least 15 minutes.

## Rollback

- [ ] Stop the release if payment processing, authentication, or booking creation is impaired.
- [ ] Promote the prior Vercel deployment and verify its health endpoint.
- [ ] Do not roll back a destructive database migration automatically. The rollback owner decides whether to restore, run a forward fix, or place the affected feature in maintenance mode.
- [ ] Record the incident, customer impact, and follow-up owner.
