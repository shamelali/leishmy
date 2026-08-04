# Leish! Product Roadmap

Updated: August 2026

## Direction

Leish! is a Malaysian beauty-services marketplace. The near-term focus is making discovery, booking, and operations dependable before adding broader marketplace and growth features.

## Completed Foundation

- [x] Authentication, role-based access, and customer/artist/studio/admin dashboards
- [x] Booking lifecycle: request, quote, acceptance, deposit, completion, and final payment
- [x] Billplz payments, commission tracking, payout release, invoices, and reconciliation jobs
- [x] Messaging, in-app/email/WhatsApp notifications, reviews, favorites, referrals, and loyalty
- [x] Cloudinary media support, Sentry monitoring, dynamic sitemap, and optimized PWA icons
- [x] Scheduled operational jobs: reminders, follow-ups, payment reconciliation, and weekly digests

## Now — Production Readiness

These items remove operational risk and should be completed before expanding scope.

- [ ] Configure a Neon preview database for Playwright and run E2E tests in pull requests.
- [ ] Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel for distributed rate limiting.
- [ ] Verify Billplz production callback URLs and webhook secret in Vercel.
- [ ] Confirm Cloudinary is serving the remaining large public images rather than Vercel static storage.
- [ ] Monitor the Next.js/PostCSS/Sharp dependency overrides after framework upgrades.
- [x] Establish a production-release checklist: preview verification, migrations, payment smoke test, and rollback owner. See `docs/PRODUCTION_RELEASE_CHECKLIST.md`.

## Next — Discovery & Booking Quality

### Search and SEO

- [ ] Full-text search across artists, studios, services, categories, and locations.
- [ ] Filters for price, rating, availability, and location.
- [ ] Sorting by relevance, price, rating, popularity, and distance where location data permits.
- [ ] Add JSON-LD structured data to public artist, studio, and service pages.

### Availability

- [x] Provider availability calendars and working hours.
- [ ] Real-time slot validation during booking.
- [ ] Configurable buffer time between appointments.
- [ ] iCalendar export, followed by Google/Outlook calendar sync if adoption warrants it.

### Notifications

- [ ] Deploy the push-subscription migration and configure VAPID production secrets.
- [ ] Deliver push notifications for bookings, quotes, and messages.
- [ ] Per-user delivery preferences for email, push, and WhatsApp.
- [ ] Quiet-hours support across every delivery channel.

## Later — Marketplace Operations & Growth

### Studio operations

- [ ] Staff management, assignment, and availability.
- [ ] Inventory and low-stock alerts.
- [ ] Studio-specific pricing overrides.
- [ ] Multi-studio support for chains.

### Payments and monetisation

- [ ] Promo codes and discounts.
- [ ] Bundle packages.
- [ ] Studio subscription plans.
- [ ] Evaluate SGD support only after validating cross-border demand.

### Growth and administration

- [ ] Automated post-booking review requests.
- [ ] Artist/studio content and social integrations.
- [ ] Admin bulk operations, commission-management UI, and platform announcements.
- [ ] Vercel Web Analytics and role-specific booking, revenue, and retention dashboards.

## Ongoing — Trust, Performance & Mobile

- [ ] PDPA review, data export/deletion workflow, and two-factor authentication.
- [ ] Query/index audit, connection-pooling review, edge caching, and dashboard lazy loading.
- [ ] Touch-focused booking flow, mobile dashboard navigation, and offline support.
- [ ] Browser-based translation only if customer demand supports it; do not introduce server-side i18n.

## External Dependencies

| Item | Needed action |
|---|---|
| E2E environment | Create/configure a Neon preview branch database. |
| Push delivery | Generate VAPID keys, configure Vercel secrets, and deploy the subscription migration. |
| Distributed rate limits | Add Upstash Redis credentials to Vercel. |
| Remote MCP integrations | Authorize Cloudflare and Meta via browser OAuth. |
| Sentry MCP | Provide `SENTRY_AUTH_TOKEN` if MCP access is required. |

## Revenue Model

- Current: 8% commission on completed bookings, configurable through admin settings.
- Planned: studio SaaS subscriptions, featured listings, and premium analytics.
