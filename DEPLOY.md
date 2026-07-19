# Production Deployment

The project deploys directly from `main` via Vercel's git integration.
Production: **https://leish.my** (Vercel project: `migrate-leishmy-to-nextjs`).

## Deploy to Production

```bash
# 1. Commit changes to main
git add -A
git commit -m "<message>"

# 2. Push to origin (Vercel auto-builds a preview from the push)
git push origin main

# 3. Verify the preview via the Vercel dashboard
#    https://vercel.com/shamelalis-projects/migrate-leishmy-to-nextjs

# 4. Promote to production once verified
vercel promote <preview-deployment-url>
```

Or, to deploy a local commit without pushing first:

```bash
# Creates a preview from the current local state
vercel deploy --yes

# Verify, then promote
vercel promote <preview-url>
```

The previous `opencode/sunny-mountain` branch and its associated Vercel
project have been removed. The current model is single-branch: `main` is
the source of truth, and Vercel manages previews + production deploys.

## CSP Reminder

When adding new external services:

1. Identify which CSP directive applies (`script-src`, `connect-src`, `img-src`, etc.)
2. Add only the specific domain, **not** a wildcard (e.g., `https://api.example.com`, not `https:`)
3. Verify with the Vercel preview deployment before promoting

CSP is set in `src/proxy.ts` — update it when adding new external domains.

## Cloudinary

The signed browser upload flow (`/api/upload/sign` → direct POST to
`https://api.cloudinary.com/v1_1/{cloud}/image/upload`) requires these env
vars in BOTH `.env` (for dev) and Vercel (for production):

| Var | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Set in Vercel env |
| `CLOUDINARY_API_KEY` | Set in Vercel env |
| `CLOUDINARY_API_SECRET` | Set in Vercel env |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Set in Vercel env |

To verify after any rotation:

```bash
npx tsx scripts/verify-sign.ts
```

Expected output: `RESULT: signature accepted, upload succeeded.`

If it returns 401 instead, the most common cause is `max_file_size` being
included in the signed params — Cloudinary strips it from toSign but
counts it when verifying, so the signature mismatches. The fix is in
`src/app/api/upload/sign/route.ts:84-90`: the `params` object passed to
`api_sign_request` must NOT contain `max_file_size`. The
`e2e/cloudinary.spec.ts` file has a structural test that catches this
regression.

A historical note: the previous credentials in this repo were valid for
SDK direct uploads (HTTP Basic auth) but were rejected by Cloudinary for
signed browser uploads. The current pair is verified end-to-end.
