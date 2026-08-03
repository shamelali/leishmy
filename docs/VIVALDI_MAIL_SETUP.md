# Vivaldi Mail — Connect @leish.my

How to send as `@leish.my` and receive your `@leish.my` mail in Vivaldi Mail (desktop).

## How it works

- **Receive:** `@leish.my` has no mailbox of its own. Cloudflare Email Routing forwards all
  `@leish.my` mail to Gmail (catch-all → `leishstudio.main@gmail.com`). Vivaldi connects to
  that Gmail inbox via IMAP (OAuth) to read the forwarded mail.
- **Send:** Vivaldi sends as any `@leish.my` identity through the Brevo SMTP relay.

## Prerequisites

1. Access to the `leishstudio.main@gmail.com` account.
2. A Brevo **SMTP key** (NOT the API key):
   - Brevo dashboard → Settings → **SMTP & API** → **SMTP keys** → *Generate new SMTP key*.
   - It is only shown once — copy it somewhere safe now.
   - The stored `BREVO_API_KEY` (API-only) is rejected by SMTP with `535 5.7.8`.

## SMTP relay settings (for all steps below)

| Field | Value |
|---|---|
| Server | `smtp-relay.brevo.com` |
| Port | `587` |
| Encryption | STARTTLS (TLS) |
| Login | `aa2b54001@smtp-brevo.com` |
| Password | your Brevo **SMTP key** |
| Auth | Normal password |

## Step 1 — Add the receiving Gmail account

1. Vivaldi → `Settings` (gear, bottom-left) → `Mail` → `Accounts`.
2. Click **+** → choose **Gmail**.
3. Sign in as `leishstudio.main@gmail.com` in the browser popup (OAuth — no app password needed).
4. Vivaldi auto-configures `imap.gmail.com:993` (SSL). Tick **Import settings and data** to pull existing mail.

## Step 2 — Add the Brevo SMTP server

1. `Settings` → `Mail` → `Accounts` → select the new Gmail account.
2. Under **Sending** (SMTP servers) → **+ Add SMTP server**.
3. Enter the SMTP relay settings from the table above.
4. Click **Test** until it reports success, then **OK**.
5. Leave `smtp.gmail.com` as the account's default so ordinary Gmail mail still goes out via Gmail.

## Step 3 — Create the @leish.my identities

1. `Settings` → `Mail` → `Identities` → **+**.
2. Create one identity per address, e.g. `hello@leish.my`, `support@leish.my`, `studio@leish.my`.
3. Per identity:
   - **Full name:** your name / Leish Studio
   - **Email:** the `@leish.my` address
   - **Reply-to:** same `@leish.my` address
   - **SMTP server:** Brevo (smtp-relay.brevo.com) — set explicitly, do not leave default.
4. Attach the identities to the `leishstudio.main@gmail.com` account (the account's Identities list).

## Step 4 — Verify

- **Send:** compose a message, switch to an `@leish.my` identity, send to an external inbox.
  Confirm it arrives and is not in spam (DMARC is `p=quarantine`, so authentication failures land in spam).
- **Receive:** email `hello@leish.my` from another account → it should appear in the Vivaldi
  inbox within ~a minute via the Cloudflare Email Routing forward.

## Troubleshooting

- **`535 5.7.8 Authentication failed`** → you are using the API key. Generate a dedicated SMTP key.
- **Message lands in spam** → check SPF (`include:brevo.com`) and DKIM (`brevo._domainkey`) are intact on `leish.my`.
- **Gmail folder missing** → re-open Vivaldi → Settings → Mail → Accounts → Gmail → *Sync settings*.
