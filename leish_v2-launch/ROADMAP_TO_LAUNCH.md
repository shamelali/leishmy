# Leish! v2 — Roadmap to Launch 🚀 (updated 2026-08-17)

**Launch gate (docs/HANDOVER.md):** 10 real MUAs in Klang Valley **+** a working Billplz live-money test.

## ✅ Done today (patch `a9a0785`, see NOTES.md)

- Public booking loop unified onto the tested db-facade backend (single payment path, single webhook)
- Artist profile claims gated on verified email
- CI workflow added (typecheck / lint / 122 tests / build / Playwright e2e) + e2e smoke specs
- Full money loop re-verified end-to-end on the production build, with no Supabase env needed
- Docs corrected (webhook URL, smoke test, architecture)

## Remaining — by phase

### Phase 1 — Infrastructure (owner accounts needed) — Day 1–2
- [ ] Fresh Supabase project → `supabase db push` → verify RLS on all tables
- [ ] `DATABASE_URL` (Supabase pooler) in Vercel + `npm run db:migrate` against prod
- [ ] New Vercel project with full prod env (`NEXT_PUBLIC_URL=https://leish.my`); only
      `/admin/**` + proxy need Supabase URL/anon-key now
- [ ] Brevo sender domain SPF/DKIM · Sentry project · Vercel crons with `CRON_SECRET`
- [ ] Domain `leish.my` → Vercel; human review gate on `main` deploys

### Phase 2 — Live-money proof (the gate) — Day 3
- [ ] Billplz production keys; webhook URL = `https://leish.my/api/payments/webhook`
- [ ] **RM 1 real payment**: bill → webhook → HMAC verified → `paid` → booking `confirmed`
- [ ] Run the 7-step smoke test in `docs/DEPLOY.md` on the real domain

### Phase 3 — Supply: 10 real Klang Valley MUAs — Day 1–7 (parallel)
- [ ] Replace demo catalog in `src/lib/data.ts` with 10 real MUAs (bios, services, prices, photos)
- [ ] Onboard MUA accounts; verified-email claims; portfolios in Supabase Storage
- [ ] Confirm legal pages (terms/privacy/refunds)

### Phase 4 — Residual code nits (parallel, optional before launch)
- [ ] Decide admin-surface direction (Supabase-based `/admin` vs. db-facade store)
- [ ] Nicer "payment gateway unavailable" message on `pay-fee` (currently generic 500, logged)
- [ ] 404 status for bad artist slugs (streaming quirk) if SEO requires

### Phase 5 — Go-live & monitor
- [ ] Promote to `leish.my`; verify HTTPS/HSTS/security headers/CSP nonce
- [ ] Re-run booking smoke on the real domain; watch Sentry 48h
- [ ] Announce with the existing launch-marketing assets

**Realistic launch: ~1–2 weeks**, gated by MUA onboarding (Phase 3) — not by code.

## Post-launch (deliberately cut from v1)

Studios & commissions · in-app messaging (WhatsApp interim) · loyalty/pro tiers · reviews ·
push notifications · full-text search + JSON-LD · real-time slot validation · PDPA/data export.
