# Production Deployment Checklist - Leishmy Next.js

## Pre-Deployment (Local)

### 1. Code Quality
- [ ] `pnpm lint` - passes
- [ ] `pnpm typecheck` - passes
- [ ] `pnpm build` - passes
- [ ] `pnpm test:e2e` - all 32 tests pass

### 2. Environment Variables (Vercel Dashboard)
Set all from `.env.example` in Vercel Project Settings → Environment Variables:

**Required for Core Functionality:**
- [ ] `DATABASE_URL` - Neon production connection string
- [ ] `NEXT_PUBLIC_URL` - `https://leish.my`
- [ ] `BILLPLZ_API_URL` - `https://www.billplz.com/api/v3`
- [ ] `BILLPLZ_API_KEY` - Production API key
- [ ] `BILLPLZ_COLLECTION_ID` - Production collection ID
- [ ] `BILLPLZ_SIGNATURE_KEY` - Production signature key
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - `dwunxyssk`
- [ ] `CLOUDINARY_CLOUD_NAME` - `dwunxyssk`
- [ ] `CLOUDINARY_API_KEY` - `566459419113617`
- [ ] `CLOUDINARY_API_SECRET` - (production secret)
- [ ] `BREVO_API_KEY` - Production API key
- [ ] `FROM_EMAIL` - `hello@leish.my`
- [ ] `FROM_NAME` - `Leish`
- [ ] `NEON_AUTH_BASE_URL` - Production Neon Auth URL
- [ ] `NEON_AUTH_COOKIE_SECRET` - Production cookie secret
- [ ] `NEXT_PUBLIC_NEON_AUTH_BASE_URL` - Same as above
- [ ] `CRON_SECRET` - Secure random string for cron auth
- [ ] `UPSTASH_REDIS_REST_URL` - Redis URL (rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Redis token

**Optional but Recommended:**
- [ ] `GOOGLE_CALENDAR_ID` - Calendar integration
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` - Service account JSON
- [ ] `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Business API
- [ ] `WHATSAPP_ACCESS_TOKEN` - WhatsApp token
- [ ] `SENTRY_DSN` - Error monitoring
- [ ] `SENTRY_ORG` - Sentry org slug
- [ ] `SENTRY_PROJECT` - Sentry project slug
- [ ] `NEXT_PUBLIC_GA_ID` - GA4 Measurement ID

**Email Aliases (for Brevo inbound):**
- [ ] `SUPPORT_EMAIL`
- [ ] `BILLING_EMAIL`
- [ ] `MARKETING_EMAIL`
- [ ] `ADMIN_EMAIL`
- [ ] `NOTIFICATIONS_EMAIL`
- [ ] `STUDIO_EMAIL`
- [ ] `ARTIST_EMAIL`
- [ ] `INFO_EMAIL`
- [ ] `CENTRAL_INBOX_EMAIL`

### 3. External Service Configuration

**Billplz:**
- [ ] Webhook URL: `https://leish.my/api/webhook`
- [ ] Callback URL: `https://leish.my/api/webhook`
- [ ] Redirect URL pattern: `https://leish.my/bookings/{booking_id}/success`

**Cloudinary:**
- [ ] Run `pnpm cloudinary:auto-upload` after env vars set
- [ ] Verify with `npx tsx scripts/verify-sign.ts`

**Neon Auth:**
- [ ] Allowed origins includes `https://leish.my`
- [ ] Cookie domain configured for production

**Brevo (Sendinblue):**
- [ ] Sender domain verified (`leish.my`)
- [ ] Inbound parse webhook: `https://leish.my/api/email/inbound`
- [ ] Webhook secret configured

**Vercel Cron Jobs:**
- [ ] `vercel.json` deployed with:
  - `0 3 * * *` → `/api/cron/sweep-orphans`
  - `30 3 * * *` → `/api/cron/reconcile-payments`

---

## Deployment Steps

### 1. Push to Main
```bash
git add -A
git commit -m "MVP ready: all tests pass, error/loading pages complete"
git push origin main
```

### 2. Vercel Preview Deployment
- [ ] Vercel auto-builds preview from push
- [ ] Note preview URL: `https://migrate-leishmy-to-nextjs-<hash>.vercel.app`

### 3. Run Production Migrations
```bash
# Against production Neon DB
DATABASE_URL="<production-neon-url>" pnpm db:migrate
```

### 4. Seed Production Data (if needed)
```bash
DATABASE_URL="<production-neon-url>" pnpm db:seed
```

### 5. Verify Preview Deployment
- [ ] Homepage loads
- [ ] Login/Register works
- [ ] Artist listing works
- [ ] Booking flow works
- [ ] Payment (Billplz) webhook test
- [ ] Cloudinary upload works
- [ ] Admin dashboard accessible
- [ ] Artist dashboard accessible
- [ ] All 4 locales work (en, ms-MY, zh-MY, ta-MY)
- [ ] Dark mode works
- [ ] Sentry receives test error

### 6. Configure Cloudinary
```bash
# With production env vars available locally
pnpm cloudinary:auto-upload
npx tsx scripts/verify-sign.ts
```

### 7. Promote to Production
```bash
vercel promote <preview-url>
# Or via Vercel dashboard
```

### 8. Post-Promotion Verification
- [ ] Production URL loads: `https://leish.my`
- [ ] Custom domain configured
- [ ] SSL certificate valid
- [ ] Billplz webhook receives test event
- [ ] Cron jobs execute (check Vercel logs next day)
- [ ] Sentry monitoring active
- [ ] Analytics tracking

---

## Rollback Plan
If issues detected:
1. `vercel rollback <previous-deployment-url>` in Vercel dashboard
2. Revert DB migrations if schema changed (use Neon branch)
3. Check Sentry for error spikes

---

## Post-Launch Monitoring (First 24h)
- [ ] Error rate < 1% (Sentry)
- [ ] Payment success rate > 95% (Billplz dashboard)
- [ ] Page load times < 3s (Vercel Analytics)
- [ ] Cron jobs executed (Vercel function logs)
- [ ] Email delivery working (Brevo logs)
- [ ] No CSP violations (browser console)

---

## Emergency Contacts
- **Vercel:** Dashboard → Project → Support
- **Neon:** Console → Project → Support
- **Billplz:** support@billplz.com
- **Cloudinary:** Dashboard → Support
- **Brevo:** Dashboard → Help