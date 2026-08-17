# NEXT STEPS — for the new Arena session (Option B)

**Goal:** push branch `launch-hardening` to `shamelali/leish_v2` and open the PR.

**Status:** The PR request is already filed as **issue #8** on leish_v2:
https://github.com/shamelali/leish_v2/issues/8 (contains the full PR body + how-to).
The old sandbox token had `push: false` on leish_v2 (issues allowed, contents denied).
With the app granted **Read & write** on leish_v2, a new session's token will have
`push: true` and can open the PR.

**Context:** commit `a9a0785` ("Unify public booking loop onto db-facade backend;
harden launch gates", base `main` @ `d69b3ac`) is verified and bundled in this repo.
See `NOTES.md` (verification record) and `PR_BODY.md` (PR title/body).

## What the previous session already did

- Unified the public booking loop onto the db-facade backend (artist pages, booking
  calendar, success page) — no Supabase env needed for public routes.
- Removed the legacy fork (`src/lib/actions/*`, `src/lib/payments/*`,
  `src/app/api/payments/billplz/*`). Single webhook: `POST /api/payments/webhook`.
- Gated artist profile claims on verified email.
- Added CI workflow + e2e smoke specs.
- Verified: typecheck / lint / 122 tests / build green; 19/19 live end-to-end checks.

## What YOU must do now (one command)

Prerequisite: the Arena GitHub app has **Read & write** access to `shamelali/leish_v2`
(the user says they are granting it — if push still 403s, remind them:
repo → Settings → GitHub Apps → Arena agent → Read & write).

```bash
cd <workspace>/leishmy          # this checkout, session branch arena/01a00de3-leishmy
bash leish_v2-launch/open-pr.sh
```

That script: clones `shamelali/leish_v2` → restores `launch-hardening` from
`patches/leish_v2-launch-hardening.bundle` → pushes the branch → runs
`gh pr create --base main --head launch-hardening` with the body from `PR_BODY.md`.

## Fallbacks

- No `gh`? Push manually, then open the PR via web using `PR_BODY.md`.
- Want to review first? `git am leish_v2-launch/patches/0001-unify-booking-loop.patch`
  in a clean clone of `main`.
- After merge: the remaining launch work is owner-side (Supabase/Vercel/Billplz/Brevo
  provisioning, RM 1 live-money test, 10 real Klang Valley MUAs) — see
  `ROADMAP_TO_LAUNCH.md` phases 1–5.
