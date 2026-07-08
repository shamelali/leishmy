# Production Deployment

The project uses a two-branch deployment model:

| Branch | Environment |
|--------|-------------|
| `main` | Development / staging |
| `opencode/sunny-mountain` | **Production** (Vercel) |

## Deploy to Production

```bash
# 1. Switch to production branch
git checkout opencode/sunny-mountain

# 2. Cherry-pick the commit(s) from main
git cherry-pick <commit-hash>

# 3. Resolve conflicts if any (usually in src/proxy.ts or src/db/index.ts)
#    Keep the production version when in doubt.

# 4. Deploy preview and verify
vercel deploy --preview

# 5. Promote to production
vercel promote
```

## Cherry-Pick Tips

- If `proxy.ts` conflicts: keep both CSP additions (the wildcard removal safety + any new domains from production).
- If `db/index.ts` conflicts: ensure the `pool.on("error")` handler is present.
- If `Navbar.tsx` conflicts: ensure no `next-intl` imports survive.

## CSP Reminder

When adding new external services:

1. Identify which CSP directive applies (`script-src`, `connect-src`, `img-src`, etc.)
2. Add only the specific domain, **not** a wildcard (e.g., `https://api.example.com`, not `https:`)
3. Verify with the Vercel preview deployment before promoting

Both `src/proxy.ts` and `src/middleware.ts` can set CSP — ensure they stay in sync.

## Cloudinary

The signed browser upload flow (`/api/upload/sign` → direct POST to
`https://api.cloudinary.com/v1_1/{cloud}/image/upload`) requires these env
vars in BOTH `.env` (for dev) and Vercel (for production):

| Var | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | `dwunxyssk` |
| `CLOUDINARY_API_KEY` | `566459419113617` |
| `CLOUDINARY_API_SECRET` | `IAOgF4Y2IRNQmtNpXyyh4rFb_JA` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dwunxyssk` |

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

A historical note: the previous credentials in this repo (key
`325638819856727`, secret `5GNEWro9z8bqn0REtEDt_wplUlg`) were valid for
SDK direct uploads (HTTP Basic auth) but were rejected by Cloudinary for
signed browser uploads. The current pair is verified end-to-end.
