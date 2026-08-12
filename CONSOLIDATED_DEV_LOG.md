# Duta Integra / Leish! — Consolidated Development Log

> **Single source of truth for the dutaintegra.my development.**
> Created 2026-08-12 on chat `arena/019ff615-leishmy` to replace the scattered
> Arena chats. Keep **this one chat** as the master; the others can be deleted
> (see §4). This file is the durable, repo-tracked anchor for that single chat.

---

## 0. What "dutaintegra.my" refers to

| Field | Value |
|---|---|
| Product | **Leish!** — Malaysian beauty-services marketplace (discover, book, pay, review) |
| Public domain | `https://leish.my` |
| Operating entity | **Duta Integra Solutions (TR0325441-K)** — Sole Proprietorship, registered under the Registration of Businesses Act 1956 |
| Support email | `support@leish.my` |
| Repo | `shamelali/leishmy` |
| Current HEAD | `c93db35` — "fix: replay Billplz webhooks instead of simulating retries (#17)" |

"dutaintegra.my" is the project/company shorthand for this codebase. Duta Integra
Solutions is named on the privacy policy, terms of service, cancellation policy,
invoices (PDF + HTML), and footer.

---

## 1. The chronological chat map (which was first, second, next)

You lost track of the order. Here it is, reconstructed from merged PRs, GitHub
issues, and the `arena/<id>-leishmy` branch IDs each Arena session created. **Read
top-to-bottom: this is the real development timeline.**

### Arena AI coding-agent chats (the "chats" you want consolidated)

| # | Date | Chat / branch | PR | What that chat did | Status |
|---|------|---------------|----|--------------------|--------|
| 1 | 2026-07-16 | `arena/019f6ccb-leishmy` | [#4](https://github.com/shamelali/leishmy/pull/4) | Made env validation + auth lazy to prevent 404 on all routes | ✅ merged |
| 2 | 2026-08-03 | `arena/019fc828-leishmy` | — (report committed via #11) | Full **launch readiness audit** → produced `LAUNCH_READINESS_REPORT.md`; patched CI env, better-auth/next/postcss/sharp/esbuild CVEs (27→0), fixed CSP for GA/FB Pixel, `/terms`→`/terms-of-service` redirect | ✅ merged |
| 3 | 2026-08-04 | `arena/019fcae1-leishmy` | [#11](https://github.com/shamelali/leishmy/pull/11) | Added launch marketing plan (90-day GTM) + branded slide deck | ✅ merged |
| 4 | 2026-08-12 | `arena/019ff42a-leishmy` | [#15](https://github.com/shamelali/leishmy/pull/15) | Audited codebase; resolved type, lint, build, and auth errors | ✅ merged |
| 5 | 2026-08-12 | `arena/019ff49a-leishmy` | [#16](https://github.com/shamelali/leishmy/pull/16) | Hardened webhook retries and payment handling | ✅ merged |
| 6 | 2026-08-12 | `arena/019ff602-leishmy` | [#17](https://github.com/shamelali/leishmy/pull/17) | Replay Billplz webhooks instead of simulating retries | ✅ merged (HEAD) |
| 7 | 2026-08-12 | `arena/019ff615-leishmy` | — (this chat) | **Consolidation** — created this log; master chat going forward | 🟢 active |

### Other PRs in the same timeline (human + bots, for full context)

| PR | Date | Author | Title | Status |
|----|------|--------|-------|--------|
| [#1](https://github.com/shamelali/leishmy/pull/1) | 2026-07-06 | shamelali | Beauty Wallet — profiles, inspiration boards, loyalty rewards | ✅ merged |
| [#2](https://github.com/shamelali/leishmy/pull/2) | 2026-07-07 | shamelali | Allow Cloudflare Insights in CSP and wire up middleware | ✅ merged |
| [#3](https://github.com/shamelali/leishmy/pull/3) | 2026-07-10 | shamelali (opencode/clever-moon) | Events, reviews, notifications, i18n, and loyalty features | ✅ merged |
| [#5](https://github.com/shamelali/leishmy/pull/5) | 2026-07-17 | shamelali | (dup of #2) Cloudflare Insights CSP | ❌ closed |
| [#6](https://github.com/shamelali/leishmy/pull/6) | 2026-07-20 | app/sentry | perf: optimize N+1 in getCategoryCounts | ❌ closed (stale auto-PR) |
| [#7](https://github.com/shamelali/leishmy/pull/7) | 2026-07-21 | app/sentry | fix: next-intl middleware context | ❌ closed (stale auto-PR) |
| [#8](https://github.com/shamelali/leishmy/pull/8) | 2026-07-21 | app/sentry | fix: homepage N+1 query | ❌ closed (stale auto-PR) |
| [#12](https://github.com/shamelali/leishmy/pull/12) | 2026-08-05 | app/vercel | Install Vercel Speed Insights | ❌ closed |
| [#13](https://github.com/shamelali/leishmy/pull/13) | 2026-08-05 | shamelali | Production launch validation | ✅ merged |
| [#14](https://github.com/shamelali/leishmy/pull/14) | 2026-08-06 | shamelali | Neon→Supabase migration script and docs (Option A) | ✅ merged |

### GitHub issues

| # | Date | Title | Status |
|----|------|-------|--------|
| [#9](https://github.com/shamelali/leishmy/issues/9) | 2026-08-01 | Dual user tables (neon_auth.user + public.user) drift silently misroutes emails | ❌ closed |
| [#10](https://github.com/shamelali/leishmy/issues/10) | 2026-08-01 | Dual user-table drift: neon_auth.user vs public.user misroutes emails | ❌ closed |

> **Takeaway:** Issues #9/#10 (dual user-table drift) and the Sentry auto-PRs
> #6–#8 are all closed and superseded by later work — no action needed.

---

## 2. Current project state (consolidated)

### Stack
- **Framework:** Next.js 16.2.12 (App Router, Turbopack) · TypeScript 5.9.3 (strict)
- **Package manager:** pnpm 11.15.1
- **DB:** Neon serverless Postgres + Drizzle ORM 0.45.2 (35 migrations)
- **Auth:** `@neondatabase/auth` (Neon Auth / Better Auth)
- **Payments:** Billplz (v3 collection for customer bills; **v5 payment_orders** for payouts — see AGENTS.md)
- **Email:** Brevo outbound · Cloudflare Email Routing inbound (MX → Gmail, **not** Brevo Inbound Parse)
- **Storage:** Cloudinary (images)
- **Styling:** Tailwind CSS 4.1.7
- **Monitoring:** Sentry (`@sentry/nextjs`)
- **Testing:** Playwright 1.61.1 (e2e only, 11 spec files)
- **Deploy:** Vercel (auto-deploys from `main`)
- **Edge workers:** Cloudflare Workers (`email/`, `url-shortener/`, `webhook-retry-cron/`)

### What's built (shipped)
- **85 routes** = ~52 public/dashboard pages + ~85 API endpoints.
- **Public pages:** `/`, `/artists`, `/studios`, `/artists/[id]`, `/studios/[id]`, `/bookings`, `/messages`, `/favorites`, `/rewards`, `/events`, `/blog`, `/search`, `/inspiration`, `/beauty-profile`, `/pricing`, `/leish-plus`, `/contact`, `/faq`, `/artist-onboarding`, `/onboarding`, `/login`, `/register`, `/profile`, `/referrals`, `/subscription`, legal pages (`/privacy-policy`, `/terms-of-service`, `/cancellation-policy`).
- **Dashboards:** admin (overview, people, users, verification, moderation, reports, disputes, payments, content, settings, analytics, webhook-retries), artist, studio (calendar, staff, inventory, finance, bookings, quotes, schedules, services, share, analytics, edit).
- **Booking lifecycle:** request → quote → accept/reject → deposit → completion → final payment, with scheduling-conflict checks, late fees, payout creation on completion.
- **Payments:** Billplz bills with idempotency keys, stale-payment cleanup, signature-verified webhooks, escrow + commission (8%, admin-configurable), v5 payout orders, invoices (PDF via `@react-pdf/renderer` + HTML fallback), reconciliation.
- **Messaging & notifications:** in-app conversations (`/messages`), email (Brevo), WhatsApp (chatbot component + Cloud API webhook at `/api/webhook/whatsapp`), notifications + preferences.
- **Loyalty / referrals / waitlist / promo codes** (`/api/promo-codes*`, `/api/loyalty`, `/api/referrals*`, `/api/waitlist`).
- **10 cron jobs** (Vercel `vercel.json`, all `CRON_SECRET`-authed): sync-auth-users, sweep-orphans, reconcile-payments, process-webhook-retries, auto-release-payments, booking-reminders, send-second-payments, lead-follow-ups, inbound-email-ack (daily 14:00 UTC), weekly-digest (Mon 01:00 UTC). Webhook-retry also has a 15-min Cloudflare Cron Trigger (preferred).
- **Ops/security:** CSP + nonce (`src/proxy.ts`), rate limiting (Upstash Redis with in-memory fallback), HMAC-verified Billplz/Cloudinary webhooks, health check (`/api/health`), admin monitoring (`/api/admin/monitoring`), PDPA-compliant legal pages, dynamic DB-driven sitemap.

### What's pending (from `docs/ROADMAP.md`, "Now / Next")
- [ ] Neon preview DB for Playwright e2e in PRs.
- [ ] Set `UPSTASH_REDIS_REST_URL/TOKEN` in Vercel for distributed rate limiting.
- [ ] Verify Billplz prod callback URLs + webhook secret in Vercel.
- [ ] Confirm Cloudinary serves remaining large public images.
- [ ] Full-text search + filters/sorting across artists/studios/services/categories/locations.
- [ ] Real-time slot validation + buffer time + iCal export during booking.
- [ ] Push notifications: deploy subscription migration + VAPID prod secrets + per-user delivery prefs + quiet hours.
- [ ] Studio ops: staff mgmt, inventory/low-stock, studio pricing overrides, multi-studio chains.
- [ ] Promo codes, bundle packages, studio subscriptions; evaluate SGD later.
- [ ] PDPA data export/deletion + 2FA; query/index audit; mobile-first booking.

### Key decisions & gotchas (do not re-litigate)
- **No server-side i18n.** `next-intl` was intentionally removed (commit `b2edee0`). Do **not** re-add `next-intl`, `src/i18n/`, locale files, `LanguageSwitcher`, `useTranslations`, or `NextIntlClientProvider`. Use browser translation only.
- **Middleware file is `src/proxy.ts`** (Next.js 16 deprecates `middleware.ts`); exports `proxy` + `config`.
- **Payouts use Billplz V5 `payment_orders`** (`src/lib/billplz-payout.ts`), distinct env `BILLPLZ_PAYMENT_ORDER_COLLECTION_ID`. Missing bank details → payout stays `pending` for admin `mark-payouts-paid`; escrow still releases.
- **Webhook retries = replay, not simulate** (PR #17, current HEAD).
- **`feat/multi-language` remote branch is stale** (208 commits behind, never merged) — do not use.
- **No GitHub Copilot/Sentry autofix PRs** — #6/#7/#8 are stale; review manually before ever merging bot PRs.
- **Cloudinary signed upload:** uses `cloudinary.utils.api_sign_request` (SHA1); `max_file_size` is **not** in signed params (fixes historical 401). Run `npx tsx scripts/verify-sign.ts`.
- **Dashboard layouts** use `cookies()` + `export const dynamic = 'force-dynamic'`.
- **Always run `pnpm check` (typecheck + unit tests + lint) before committing.**

### Known issues (current)
- ESLint clean. Sitemap is DB-driven with static fallback. Manifest icons are WebP <50K + maskable. Hero uses Cloudinary URL from admin setting `hero_bg_image` (no fallback). `public/images` is empty (Cloudinary serves images). E2E needs a real Neon preview branch DB (dummy env → ECONNREFUSED, fallback works).

---

## 3. Where the detailed knowledge lives (repo map)

| Need | Read |
|------|------|
| How to run/build/deploy, commands | `AGENTS.md` |
| Architecture, stack, routes, cron, auth, CSP, payouts | `AGENTS.md` |
| Business model & plan | `BUSINESS_PLAN.md`, `docs/BUSINESS_PLAN.md` |
| Roadmap (now/next/later) | `docs/ROADMAP.md` |
| Full launch audit (security, env, SEO, payments) | `LAUNCH_READINESS_REPORT.md` |
| Data flow diagrams | `docs/FLOW_DIAGRAMS.md` |
| Deployment steps + checklist | `DEPLOY.md`, `DEPLOYMENT_CHECKLIST.md`, `docs/PRODUCTION_RELEASE_CHECKLIST.md` |
| Webhook retry scheduling | `docs/WEBHOOK_RETRY_SCHEDULING.md` |
| Email setup (Brevo + Cloudflare) | `docs/EMAIL_SETUP.md`, `docs/VIVALDI_MAIL_SETUP.md` |
| Marketing / GTM | `docs/launch-marketing-plan*.md` + decks |
| Financials | `docs/financial-forecast.{md,xlsx,pptx}` |
| Env vars (template) | `.env.example` |
| DB schema | `src/db/schema.ts` (~765 lines) |
| Meta/WhatsApp MCP + webhook setup | `AGENTS.md` → "MCP Config" / "WhatsApp Webhook" |

---

## 4. How to finish the "one chat + delete the rest" goal

I (the agent) **cannot** list, merge, or delete your other Arena chat sessions from
inside a session — those conversations live on Arena's platform, not in this
sandbox, and no tool here can reach them. The old `arena/<id>-leishmy` branches
were already merged to `main` and deleted from the repo, so there's nothing left
to consolidate in git either. What's left is a quick UI action on your side:

1. **Keep this chat** — `arena/019ff615-leishmy` — as the single master chat. It
   now has this consolidated log (committed to the branch) plus the full repo in
   context, so it carries everything the old chats did.
2. **Verify the order** (optional) against §1 if you want to be sure which old
   chat was which before deleting.
3. **Delete the others** in the Arena UI: open each of the six old chats
   (`019f6ccb`, `019fc828`, `019fcae1`, `019ff42a`, `019ff49a`, `019ff602`) and
   delete/archive them. Their work is already merged to `main` (PRs #4, #11,
   #15, #16, #17) and captured here, so nothing is lost.
4. **From now on**, start every new dutaintegra.my task in **this** chat (or a
   fresh continuation of it) so the history stays in one place.

> If your Arena workspace instead shows chats by name rather than branch ID,
> match them to §1 by date + the PR they produced.
