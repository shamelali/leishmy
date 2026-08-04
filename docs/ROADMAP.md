# Leish! Roadmap

## Current State (Aug 2026)

**Live at**: leish.my | **Stack**: Next.js 16, Neon Postgres, Drizzle, Brevo, Billplz, Cloudinary, Vercel

### What's Built

#### Core Platform
- [x] User auth (Neon Auth / Better Auth)
- [x] Role system: customer, artist, studio, admin
- [x] 42 database tables (artists, studios, bookings, services, reviews, etc.)
- [x] 8 beauty categories with seed data
- [x] 3 dashboards: admin, artist, studio
- [x] ~30 API routes

#### Bookings & Payments
- [x] Full booking flow: request → quote → accept/reject → pay deposit → complete → pay remaining
- [x] Billplz integration (deposit + remaining payment)
- [x] Commission tracking (8% default, configurable in admin settings)
- [x] Auto-release payments cron (deducts commission, creates payouts)
- [x] Invoice download (branded HTML)
- [x] Idempotent payment processing

#### Messaging
- [x] Two-user conversations (inbox + thread UI)
- [x] Read receipts (single/double checkmarks)
- [x] Polling-based real-time (60s interval)
- [x] Booking-gated new conversations (requires confirmed/completed booking)
- [x] Safe communication (phone/email masked on-platform)

#### Engagement & Growth
- [x] Loyalty points system (earn on bookings, redeem on services)
- [x] 4 tiers: bronze/silver/gold/platinum with multipliers
- [x] Referral program (200 points per referral, 50-day expiry)
- [x] Referral UI page (share link, stats, how-it-works)
- [x] Reviews & ratings system
- [x] Favorites system
- [x] Event listings

#### Notifications
- [x] In-app notifications (unread badge, dropdown)
- [x] Email notifications (Brevo — booking confirmations, quote requests, payment received, etc.)
- [x] WhatsApp notifications (Cloud API — booking confirmations, cancellations)
- [x] Push notifications infrastructure (web-push, service worker, subscription API)
- [x] Push toggle component

#### Operations
- [x] Vercel cron jobs (9 daily/weekly jobs)
- [x] Weekly email digest (booking stats, reviews, loyalty balance)
- [x] Lead follow-up reminders
- [x] Booking reminders
- [x] Payment reconciliation
- [x] Audit logging
- [x] Sentry monitoring
- [x] Cloudinary image optimization

#### MCP Integrations (10 connected)
- [x] GitHub (local, full read/write)
- [x] Vercel (deployments, projects, analytics)
- [x] Cloudflare (Workers, DNS, analytics)
- [x] Neon (database management)
- [x] Brevo (email management)
- [x] Sequential Thinking
- [x] Filesystem, Memory

---

## Phase 3: Intelligence & Automation (Next)

### Priority 1 — Search & Discovery
- [ ] Full-text search (artist/studio/service name, location, category)
- [ ] Advanced filters (price range, rating, availability, location radius)
- [ ] Sort by: distance, price, rating, popularity
- [ ] SEO: dynamic sitemap, structured data (JSON-LD)

### Priority 2 — Scheduling & Availability
- [ ] Artist/studio availability calendar (set available hours)
- [ ] Real-time slot checking during booking
- [ ] Buffer time between bookings
- [ ] Google Calendar / Outlook sync (ical export)

### Priority 3 — Smart Notifications
- [ ] Push notification delivery (deploy push_subscriptions table + VAPID keys)
- [ ] Push notifications on new bookings, quotes, messages
- [ ] Notification preferences per user (email/push/whatsapp toggles)
- [ ] Quiet hours support

### Priority 4 — Analytics Dashboards
- [ ] Artist dashboard: booking trends, revenue charts, peak hours
- [ ] Studio dashboard: staff utilization, inventory alerts, financial summaries
- [ ] Admin dashboard: platform growth, GMV, retention metrics
- [ ] Vercel Web Analytics integration

---

## Phase 4: Marketplace Features

### Priority 1 — Studio Management
- [ ] Staff management (assign artists to studios, availability)
- [ ] Inventory tracking (products, consumables, low-stock alerts)
- [ ] Studio-level pricing (override artist pricing)
- [ ] Multi-studio support for chains

### Priority 2 — Enhanced Payments
- [ ] Multi-currency support (MYR + SGD for cross-border)
- [ ] Promo codes & discounts (% off, fixed amount, first-booking)
- [ ] Bundle packages (e.g., "Bridal package: hair + makeup + nails")
- [ ] Subscription plans for studios (monthly SaaS fee)

### Priority 3 — Content & Marketing
- [ ] Artist/studio blog posts (portfolio updates, tips)
- [ ] Social media integration (Instagram feed embed)
- [ ] Automated review request emails (post-booking)
- [ ] Testimonial carousel on homepage

### Priority 4 — Admin Tools
- [ ] Bulk operations (mass email, bulk status changes)
- [ ] Commission rate management UI (currently in DB only)
- [ ] Platform-wide announcements banner
- [ ] User impersonation (admin → view as customer/artist)

---

## Phase 5: Scale & Polish

### Priority 1 — Performance
- [ ] Image optimization audit (hero images via Cloudinary, not Vercel static)
- [ ] Database query optimization (indexes, connection pooling)
- [ ] Edge caching (Cloudflare CDN for static pages)
- [ ] Lazy loading for dashboard data

### Priority 2 — Mobile Experience
- [ ] PWA manifest + install prompt
- [ ] Touch-optimized booking flow
- [ ] Bottom navigation for mobile dashboards
- [ ] Offline support (service worker cache)

### Priority 3 — Internationalization
- [ ] Browser-based translation integration
- [ ] Multi-language support if needed (Malay, Chinese, Tamil)

### Priority 4 — Compliance & Security
- [ ] PDPA compliance (Malaysian data protection)
- [ ] Data export/deletion (GDPR-like)
- [ ] Two-factor authentication
- [ ] Rate limiting review (currently Upstash Redis)

---

## Blocked / Needs Action

| Item | Blocker | Action |
|------|---------|--------|
| Push notifications (production) | Missing VAPID keys + `push_subscriptions` table not deployed | Generate keys, set env vars, run migration |
| Sentry MCP | No `SENTRY_AUTH_TOKEN` | User to provide token |
| Supabase MCP | No `SUPABASE_ACCESS_TOKEN` | User to provide token (or remove) |
| Cloudflare/Meta remote MCPs | Need browser OAuth | User to authorize |
| Drizzle migrations | `db:push`/`db:generate` fail without TTY | Use Neon SQL API directly |
| E2E tests | Need real Neon preview branch DB | Configure preview DB |

---

## Revenue Model

- **8% commission** on completed bookings (configurable in admin_settings)
- **Future**: Studio SaaS subscriptions (RM 99-299/month)
- **Future**: Featured listings (artists pay for visibility boost)
- **Future**: Premium analytics for studios
