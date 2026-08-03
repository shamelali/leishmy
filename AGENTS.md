# AGENTS.md — Leish! (leish.my)

## Quick Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Preview (build + start) | `pnpm preview` |
| Setup (install + DB push + seed) | `pnpm setup` |
| Typecheck | `pnpm typecheck` (tsc --noEmit) |
| Lint | `pnpm lint` |
| Lint fix | `pnpm lint:fix` |
| Full check | `pnpm check` (typecheck + lint) |
| E2E tests | `pnpm test:e2e` |
| Fresh dev (reset DB) | `pnpm dev:fresh` |
| DB generate | `pnpm db:generate` |
| DB push | `pnpm db:push` |
| DB migrate | `pnpm db:migrate` |
| DB seed | `pnpm db:seed` |
| DB studio | `pnpm db:studio` |
| Verify Cloudinary sign | `npx tsx scripts/verify-sign.ts` |

**Always run `pnpm check` before committing.** TypeScript and ESLint must pass.

## No i18n — Browser Translation Only

This project does NOT use `next-intl` or any server-side i18n framework. The `next-intl` multi-language module was intentionally removed (commit `b2edee0` "Remove next-intl multi-language module, use browser translation instead"). Do NOT add `next-intl`, `i18n/`, or any locale files back. There is no `src/i18n/`, no `src/locales/`, no `LanguageSwitcher.tsx`, no `useTranslations`, no `NextIntlClientProvider`. If you need multi-language support, use browser-based translation (Google Translate widget etc.).

## Architecture

### Stack
- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **Language**: TypeScript 5.9.3 (strict mode)
- **Package manager**: pnpm 11.15.1
- **Database**: Neon (serverless Postgres) + Drizzle ORM 0.45.2
- **Auth**: `@neondatabase/auth` (Neon Auth / Better Auth)
- **Payments**: Billplz (Malaysian payment gateway)
- **Email**: Brevo (`@getbrevo/brevo`)
- **Storage**: Cloudinary (images)
- **Styling**: Tailwind CSS 4.1.7
- **Monitoring**: Sentry (`@sentry/nextjs`)
- **Testing**: Playwright 1.61.1 (e2e only)
- **Deploy**: Vercel (auto-deploys from `main`)

### Key Directories

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/app/api/` | REST API endpoints (~30 routes) |
| `src/app/dashboard/` | 3 dashboards: `admin/`, `artist/`, `studio/` |
| `src/app/api/auth/[...path]/` | Neon Auth handler (catch-all) |
| `src/app/api/cron/` | Vercel cron jobs (6 daily jobs) |
| `src/components/` | Shared React components |
| `src/components/home/` | Homepage section components |
| `src/lib/` | Business logic, utilities, integrations |
| `src/lib/auth/` | Neon Auth setup (`auth.ts`) |
| `src/lib/email/` | Brevo email templates/sending |
| `src/lib/env.ts` | Env validation with Zod (required + optional vars) |
| `src/lib/env-prefix.ts` | Prefixed env reader for Neon Auth config |
| `src/db/` | Drizzle schema (`schema.ts`), DB client (`index.ts`) |
| `src/context/` | React contexts: Auth, Favorites, Notifications, Toast |
| `src/instrumentation-client.ts` | Client-side Sentry init |
| `src/instrumentation.ts` | Server-side Sentry init |
| `drizzle/` | Drizzle migration SQL files (20+ migrations) |
| `scripts/` | One-off scripts (seed, sweep, backfill, verify) |
| `e2e/` | Playwright end-to-end tests (11 spec files) |
| `workers/` | Cloudflare Workers (`email/` has own `package.json`; `url-shortener/` shares root workspace) |

### Route Structure

- `/` — Homepage (Hero, Categories, Featured, Testimonials)
- `/artists` / `/studios` — Listing pages
- `/artists/[id]` / `/studios/[id]` — Detail pages with booking
- `/dashboard/admin` — Admin panel (overview, people, moderation, reports, settings)
- `/dashboard/artist` — Artist dashboard (profile, bookings, services, portfolio, analytics)
- `/dashboard/studio` — Studio dashboard (calendar, staff, inventory, finance)
- `/bookings` — User's active bookings
- `/login`, `/register`, `/profile`, `/favorites`, `/rewards`, `/events` — Standard pages
- `/admin` — Rewrites to `/dashboard/admin`

### Middleware (`src/proxy.ts` — not `middleware.ts`)

Next.js 16 deprecates `middleware.ts`. The file is named `src/proxy.ts` and exports `proxy` + `config`. It handles:
- Dashboard auth (Neon Auth session check)
- Public page cookie-based redirect to `/login`
- API rate limiting (Upstash Redis)
- CSP headers with nonce support (Cloudflare Insights, Cloudinary)

### Auth Flow

Uses `@neondatabase/auth/next/server`. Auth routes are at `/api/auth/[...path]`. Session can be checked server-side via `getSession()` from `src/lib/auth/auth.ts`. The session cookie name is `__Secure-neon-auth.session_token` or `neon-auth.session_token`. Auth config reads prefixed env vars via `src/lib/env-prefix.ts` (`prefixedEnvReader("NEON_AUTH_")`).

### Database

- **Schema**: Single file `src/db/schema.ts`
- **Migrations**: In `drizzle/` (numbered SQL files)
- **Client**: `import { db } from "@/db"` gives you a Drizzle client
- **Env**: `DATABASE_URL` must be set (Neon connection string)
- **Migration order**: `pnpm db:generate` → `pnpm db:migrate`

### CSP / Nonce Pattern

The root layout reads `x-nonce` from response headers (set by `src/proxy.ts`) and passes it to `<ThemeScript>` and `<Script>` tags. New inline scripts must follow this pattern:

```tsx
const hdrs = await headers();
const nonce = hdrs.get("x-nonce") || undefined;
```

### Env Validation

`src/lib/env.ts` validates required env vars at startup using Zod. Required vars: `DATABASE_URL`, `NEXT_PUBLIC_URL`, `CRON_SECRET`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`. Additional vars like `BREVO_API_KEY`, `BILLPLZ_*`, `CLOUDINARY_*` are optional in the schema but may be needed for full functionality in production.

### Vercel Cron Jobs

Defined in `vercel.json` — 6 daily cron jobs. Each uses `CRON_SECRET` for auth. Paths: `/api/cron/sync-auth-users`, `/api/cron/sweep-orphans`, `/api/cron/reconcile-payments`, `/api/cron/auto-release-payments`, `/api/cron/booking-reminders`, `/api/cron/send-second-payments`.

### Sentry

Sentry is initialized in `src/instrumentation-client.ts` (client) and `src/instrumentation.ts` (server). The root layout imports `@/instrumentation-client` and `@/lib/env` at the top. Client-side Sentry is only enabled in production when `SENTRY_DSN` is set.

## Current Known Issues

- **ESLint is clean** — all previous errors resolved.
- **Sitemap** now includes DB-driven dynamic routes (artists, studios, services, categories) — falls back to static routes if DB is unavailable at build time.
- **Manifest icons** compressed to WebP (<50K) with maskable icon added.
- **HeroSection** uses Cloudinary URLs when `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set; falls back to local `/images/` paths.
- **E2E tests** need a real Neon preview branch DB (dummy env causes ECONNREFUSED but fallback works).
- **Public/images** (9.4MB) should be served via Cloudinary, not Vercel static — verify Cloudinary upload configuration for hero images.

## MCP Config

MCP servers are configured in `opencode.json` at the repo root. The `.opencode/` directory contains the OpenCode plugin (`@opencode-ai/plugin`). Do not edit `.opencode/node_modules` or `.opencode/package-lock.json`.

## Notes

- **No GitHub Copilot autofix PRs** — Sentry generated some auto-PRs (PR ##6, ##7, ##8), but the codebase has moved since. Review manually before merging.
- **The `feat/multi-language` remote branch is stale** — 208 commits behind main, never merged. Do not use.
- **Outbound email** uses Brevo. **Inbound email** uses Cloudflare Email Routing (MX records) — not Brevo Inbound Parse.
- **`workers/`** contains standalone Cloudflare Workers: `email/` has its own `package.json` and `wrangler.jsonc`; `url-shortener/` shares the root workspace config and has its own `wrangler.jsonc` but no `package.json`.
- **CI** runs `pnpm typecheck`, `pnpm lint`, `pnpm build` on push/PR to `main`.
