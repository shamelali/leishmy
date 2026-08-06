# Email Setup

## Outbound (Transactional)

**Provider:** Brevo (Sendinblue)
**Code:** `src/lib/email/brevo.ts`
**API Key:** `BREVO_API_KEY` env var
**Rate limit:** 300 emails/day (free tier)

Used for: booking confirmations, payment receipts, welcome emails, subscription notifications, contact form submissions.

### Gmail "Send Mail As" (for team members to reply as @leish.my)

1. Gmail → Settings (gear) → See all settings → Accounts & Import
2. "Send mail as" → Add another email address
3. Name: your name, Email: your @leish.my address
4. Uncheck "Treat as alias"
5. SMTP Server: `smtp-relay.brevo.com`, Port: `587`
6. Username: `aa2b54001@smtp-brevo.com` (SMTP relay login from Brevo's account API)
7. Password: your Brevo **SMTP key** (Settings → SMTP & API → SMTP keys — NOT the `BREVO_API_KEY`; the API key fails SMTP AUTH with `535 5.7.8`)
8. Secured connection using TLS

> Verified 2026-08-03: the API key authenticates to the Brevo **API** (`/v3/account` → `200`) but is **rejected by the SMTP relay** (`smtp-relay.brevo.com:587`) with `535 5.7.8 Authentication failed`. Use the relay login above + a dedicated SMTP key.

### SMTP Env Vars

- `BREVO_SMTP_LOGIN`: Brevo SMTP relay login (example `aa2b54001@smtp-brevo.com`).
- `BREVO_SMTP_KEY`: Brevo **SMTP key** (generate under Settings → SMTP & API). Do NOT use `BREVO_API_KEY` for SMTP.

### DNS Authentication

| Record | Value |
|---|---|
| SPF | `v=spf1 include:brevo.com ~all` |
| DKIM | `brevo._domainkey` → CNAME to `b1.leish-my.dkim.brevo.com` |
| DMARC | `v=DMARC1; p=quarantine; rua=mailto:leishstudio.main@gmail.com` |

## Inbound

**Provider:** Cloudflare Email Routing
**Config:** Cloudflare Dashboard → Email → Routing
**MX Records:** Already pointing to Cloudflare

### Routing Rules

| Alias | Forward to |
|---|---|
| shamel@leish.my | shamelali@gmail.com |
| leiynda@leish.my | lyndamizzcute@gmail.com |
| support@leish.my | leishstudio.main@gmail.com |
| admin@leish.my | leishstudio.main@gmail.com |
| billing@leish.my | leishstudio.main@gmail.com |
| hello@leish.my | leishstudio.main@gmail.com |
| studio@leish.my | leishstudio.main@gmail.com |
| artist@leish.my | leishstudio.main@gmail.com |
| Catch-all (*@) | leishstudio.main@gmail.com |

Note: The `received_emails` DB table and `POST /api/email/inbound` endpoint remain in the codebase but are unused (no Brevo Inbound Parse configured).

## Aliases (used for outbound From addresses)

Defined in `src/lib/constants.ts`. Used by transactional emails.

| Key | Env Var | Default |
|---|---|---|
| support | SUPPORT_EMAIL | support@leish.my |
| billing | BILLING_EMAIL | billing@leish.my |
| marketing | MARKETING_EMAIL | marketing@leish.my |
| admin | ADMIN_EMAIL | admin@leish.my |
| notifications | NOTIFICATIONS_EMAIL | notifications@leish.my |
| info | INFO_EMAIL | info@leish.my |
| studio | STUDIO_EMAIL | studio@leish.my |
| artist | ARTIST_EMAIL | artist@leish.my |
