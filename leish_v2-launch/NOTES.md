# Leish! v2 — Launch Hardening Patch (2026-08-17)

## Commits (branch `launch-hardening`, base `main` @ `d69b3ac`)

1. **`a9a0785`** — Unify public booking loop onto db-facade backend; harden launch gates
2. **`e8fadd3`** — Return true 404 for unknown artist slugs; friendly gateway-down message on pay-fee

**Artifacts** (regenerated to cover both commits): `patches/leish_v2-launch-hardening.bundle`
+ `patches/leish_v2-launch-hardening.patch` (combined, applies cleanly to pristine `main`).

## Round 2 additions (commit e8fadd3)

- **True 404 for unknown artist slugs.** The root layout streams the shell before
  `notFound()` runs (CSP nonce via `headers()` forces dynamic rendering), so unknown
  slugs committed HTTP 200 with a `noindex` 404 body. `src/proxy.ts` now short-circuits
  `/artists/<unknown>` with a rewrite that renders the global not-found UI at HTTP 404.
  Verified: unknown slug → 404 + styled "Page not found"; real artist pages → 200.
- **Friendly gateway-down message.** `POST /api/bookings/[id]/pay-fee` returns a clear
  503 ("The payment gateway is temporarily unavailable…") when the Billplz API is
  unreachable, instead of the generic 500 (details still logged/reported to Sentry).
  Dev provider unaffected. Verified: 503 with billplz env + unreachable API; 201 dev path.

## ✅ Verification record (re-run 2026-08-17, from clean state)

**Patch integrity**
- `git am`-style apply check against pristine `main`: **applies cleanly** (no conflicts) —
  re-verified after round 2 (combined 2-commit patch)
- Bundle `leish_v2-launch-hardening.bundle`: **verified OK** — contains
  `refs/heads/launch-hardening` @ `e8fadd3` (base `d69b3ac` = main)
- Clone @ `e8fadd3`: working tree clean; diff vs main = 2 commits, 20 files

**Quality gates (all re-executed)**
- `npm run typecheck` ✅ 0 errors
- `npm run lint` ✅ 0 errors
- `npm test` ✅ **122/122 tests, 24 files**
- `npm run build` ✅ compiled, 42/42 static pages, `/api/errors` is the only "error" string in output (route name)

**Live end-to-end verification suite (production build, no Supabase env): 19/19**
| # | Check | Result |
|---|---|---|
| 1 | `/artists/aisha-azman` renders booking form without Supabase env | ✅ |
| 2 | Legacy `POST /api/payments/billplz/create` removed | ✅ 404 |
| 3 | Legacy `POST /api/payments/billplz/webhook` removed | ✅ 404 |
| 4 | Homepage | ✅ 200 |
| 5 | Unverified artist profile claim rejected | ✅ 403 + message |
| 6 | Unverified booking rejected | ✅ `EMAIL_NOT_VERIFIED` |
| 7 | Unauthenticated `GET /api/bookings` | ✅ 401 |
| 8 | Hostile-origin state-changing POST (CSRF) | ✅ 403 |
| 9 | Verified artist claim succeeds | ✅ 201 profile |
| 10 | Double-claim guard | ✅ 409 |
| 11 | Booking request created | ✅ `requested` |
| 12 | Artist accepts | ✅ `accepted` |
| 13 | Quotation total (680+50+40) | ✅ 77000 sen |
| 14 | RM 200 fee recorded | ✅ 20000 sen |
| 15 | Webhook bad HMAC signature | ✅ 401 |
| 16 | Webhook valid HMAC signature | ✅ 200 |
| 17 | Booking auto-confirmed by payment | ✅ `confirmed` / `paid` |
| 18 | Artist completes booking | ✅ `completed` + invoice email |
| 19 | `/booking/success` states: confirmed w/ session · hidden w/o session | ✅ |

Server logs across the whole run: **zero Supabase errors on public routes** (the
`[supabase/server] Missing …` failures from before the patch are gone); only expected
pino lines (register/verify/claim/book/accept/quote/fee/webhook/confirm/complete/invoice).

*(One earlier "fail" line in the runner output was a truncation bug in the test script's
expected-string, not the app — confirmed by re-checking the full response.)*

**Commit:** `a9a0785` — "Unify public booking loop onto db-facade backend; harden launch gates"
**Branch:** `launch-hardening` (base: `main` @ `d69b3ac`)
**Repo:** `shamelali/leish_v2`

The public booking loop was running on **two parallel backends**: the artist-page UI on
Supabase actions (slot/deposit-percent billing) while the dashboard + `/api/*` routes ran
on the tested db-facade (request → quotation → RM 200 fee → webhook). This patch unifies
the public loop onto the db-facade and closes the launch-hardening items that were
code-fixable.

## What changed (18 files, +596 / −777)

| Area | Change |
|---|---|
| Artist pages | `/artists/[slug]` now reads the catalog (`src/lib/data.ts`) — same source as the listing pages. Renders with **zero** external env. |
| Booking UI | `BookingCalendar` rewritten: service + date + time + event type → `POST /api/bookings` (request journey). Quotation + RM 200 fee happen in the dashboard, per the leish.my business model. |
| Success page | `/booking/success` reads real booking status from the db-facade (session + DB), handles `confirmed`/`completed`/processing — never a mock. |
| Removed fork | `src/lib/actions/*`, `src/lib/payments/*`, `src/app/api/payments/billplz/*` deleted (legacy slot-based billing). Single webhook: `POST /api/payments/webhook`. |
| New gate | Artist profile **claims now require a verified email** (same rule as bookings) — `POST /api/artist-profiles` returns 403 with `Please verify your email before claiming a profile`. |
| CI | New `.github/workflows/ci.yml`: typecheck, lint, 122 vitest tests, build + Playwright e2e job. |
| E2E | New `e2e/smoke.spec.ts`: homepage/listing/profile renders, 401 unauth, EMAIL_NOT_VERIFIED booking gate, unverified-claim gate. |
| Docs | ARCHITECTURE (single-path data flow, where Supabase still appears), DEPLOY (correct webhook URL + rewritten smoke test), HANDOVER (unification note), README, `.env.example`. |

## Verification (all executed on the production build)

- `npm run typecheck` ✅ · `npm run lint` ✅ · `npm test` ✅ **122/122** · `npm run build` ✅ (legacy routes gone)
- **Live loop re-run end-to-end** on `next start` with NO Supabase env:
  - `/artists/aisha-azman` renders profile + new booking form ✅
  - Legacy routes `/api/payments/billplz/*` → 404 ✅
  - Unverified artist claim → **403** (new gate) ✅ · verified claim → 201 ✅
  - Booking gated on verified email (calendar payload) ✅
  - Register → verify → claim → book → accept → quotation (RM 770) → pay RM 200 →
    signed webhook (bad sig 401, good sig 200) → `confirmed` → complete → `completed` ✅
  - `/booking/success?bookingId=…` → "Booking confirmed!" with session, "not found" without ✅
  - Homepage, /artists, /studios, /dashboard all 200 ✅

## How to apply / review

```bash
# Option A — bundle (preserves commit):
git clone https://github.com/shamelali/leish_v2.git && cd leish_v2
git pull leish_v2-launch-hardening.bundle launch-hardening   # then: git log, git diff main

# Option B — patch (plain review):
git am 0001-unify-booking-loop.patch
```

## What still requires the owner (external accounts — not code)

1. **Phase 1 infra:** fresh Supabase project (+ `db push`, RLS check), `DATABASE_URL` = Supabase
   pooler, `npm run db:migrate`, new Vercel project with prod env,
   `NEXT_PUBLIC_URL=https://leish.my`. Note: only `/admin/**` + `src/proxy.ts` need the
   Supabase URL/anon-key vars now.
2. **Billplz prod:** production keys; webhook URL = `https://leish.my/api/payments/webhook`
   (single path); one **RM 1 live-money test** (bill → webhook → confirmed).
3. **Brevo SPF/DKIM**, Sentry project, Vercel crons (`CRON_SECRET`).
4. **Supply:** replace demo catalog in `src/lib/data.ts` with 10 real Klang Valley MUAs.
5. Run the rewritten 7-step smoke test in `docs/DEPLOY.md` on the real domain.

## Known residual notes

- `src/app/admin/**` remains Supabase-based (internal tooling) and requires the Supabase env
  vars; it manages the Supabase `providers` tables, which the public catalog no longer reads.
  Decide later whether admin should operate on the db-facade store.
- When Billplz API is unreachable, `pay-fee` returns a generic 500 ("Something went wrong…") —
  acceptable in prod (details are logged to Sentry, not leaked), but a nicer gateway-down
  message could be added.
- `/artists/<bad-slug>` streams the not-found UI with HTTP 200 (Next.js streamed-page
  semantics; same behavior as before this patch) — minor SEO nit.
- E2E specs run in GitHub Actions only (sandbox blocks the Playwright browser CDN).
- Local demo data in this workspace's clone: client `client2.smoke@example.com` /
  artist `artist2.smoke@example.com`, both password `testpass123` (one completed booking).
