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
