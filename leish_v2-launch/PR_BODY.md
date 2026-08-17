# PR: Unify public booking loop onto db-facade backend; harden launch gates

## Title
`Unify public booking loop onto db-facade backend; harden launch gates`

## Base / Head
- **Base:** `main` (`d69b3ac`)
- **Head:** `launch-hardening` — 2 commits:
  - `a9a0785` — Unify public booking loop onto db-facade backend; harden launch gates
  - `e8fadd3` — Return true 404 for unknown artist slugs; friendly gateway-down message on pay-fee
- **Diff:** 20 files, ~+630 / −780

## Body

### Why

The public booking loop was running on **two parallel backends**: the artist-page UI
(`/artists/[slug]` + `BookingCalendar`) used legacy Supabase server actions with
slot/deposit-percent billing, while the dashboard and `/api/*` routes ran the tested
db-facade journey (request → quotation → RM 200 booking fee → signed webhook → confirmed).
Artist pages therefore hard-required Supabase env vars, and the Billplz dashboard could
be pointed at the wrong webhook. This PR unifies the public loop onto the db-facade path.

### Changes

- **Artist pages** (`src/app/artists/[slug]/page.tsx`) now read the catalog
  (`src/lib/data.ts`) — the same source as the listing pages. They render with **zero
  external env vars**.
- **BookingCalendar** rewritten for the request journey: service + date + time + event
  type → `POST /api/bookings`. Quotation and the RM 200 fee happen in the dashboard,
  matching the leish.my business model.
- **`/booking/success`** reads the real booking status from the db-facade
  (session + DB): confirmed / processing / not-found — never a mock.
- **Removed the legacy fork:** `src/lib/actions/*`, `src/lib/payments/*`,
  `src/app/api/payments/billplz/*`. Single webhook: `POST /api/payments/webhook`.
- **New gate:** artist profile claims require a verified email (same rule as bookings).
- **CI:** new `.github/workflows/ci.yml` (typecheck, lint, 122 vitest tests, build,
  Playwright e2e) + `e2e/smoke.spec.ts`.
- **Docs:** ARCHITECTURE (single-path data flow), DEPLOY (correct webhook URL +
  rewritten smoke test), HANDOVER (unification note), README, `.env.example`.
- **True 404 for unknown artist slugs** (`src/proxy.ts`): the root layout streams the
  shell before `notFound()` runs, so unknown slugs previously committed HTTP 200 with a
  noindex 404 body. The proxy now short-circuits them to the styled not-found UI with
  a real 404.
- **Friendly gateway-down message**: `pay-fee` returns a clear 503 when the Billplz API
  is unreachable (details still logged/reported), instead of a generic 500.

### Verification

- `npm run typecheck` ✅ · `npm run lint` ✅ · `npm test` ✅ 122/122 · `npm run build` ✅
- Live end-to-end on the production build **with no Supabase env** (19/19 checks):
  - Artist page renders booking form; legacy billplz routes 404
  - Unverified artist claim → 403; verified claim → 201; double-claim → 409
  - Unverified booking → `EMAIL_NOT_VERIFIED`; unauth → 401; hostile origin → 403
  - Full loop: register → verify → book (`requested`) → accept → quotation RM 770 →
    RM 200 fee → webhook (bad sig 401 / valid sig 200) → `confirmed`/`paid` →
    `completed` + invoice email
  - `/booking/success` shows "Booking confirmed!" with session, hides booking without
- Server logs across the run: zero Supabase errors on public routes.

### Notes for reviewers

- `/admin/**` and `src/proxy.ts` intentionally remain Supabase-based (internal tooling)
  and still require `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- When Billplz is unreachable, `pay-fee` returns a generic 500 (details go to logs/Sentry) —
  a friendlier gateway-down message could be a follow-up.
- `/artists/<bad-slug>` streams the not-found UI with HTTP 200 (Next.js streaming
  semantics; unchanged from before) — minor SEO nit, follow-up.

## How to open this PR (when you have push access to `shamelali/leish_v2`)

```bash
git clone https://github.com/shamelali/leish_v2.git && cd leish_v2
# from this session's artifacts in shamelali/leishmy (branch arena/01a00de3-leishmy):
git fetch <path-or-url-to>/leish_v2-launch-hardening.bundle launch-hardening
git checkout launch-hardening
git push origin launch-hardening
gh pr create --base main --head launch-hardening \
  --title "Unify public booking loop onto db-facade backend; harden launch gates" \
  --body-file PR_BODY.md
```
