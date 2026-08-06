# Supabase setup for leish.my

This document summarizes the minimal steps to integrate Supabase into the project and to migrate data from Neon (Option A, keep Neon Auth).

1) Install packages (use pnpm to match repository):

   pnpm add @supabase/supabase-js @supabase/ssr

2) Add UI components (optional, from shadcn / Supabase UI):

   npx shadcn@latest add @supabase/supabase-client-nextjs

3) Env vars

   - NEXT_PUBLIC_SUPABASE_URL (public)
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (public)
   - SUPABASE_URL (internal/direct admin URL)
   - SUPABASE_SERVICE_ROLE_KEY (secret)
   - SUPABASE_POOLED_URL (pooled URL for runtime in Vercel, port 6543)
   - Keep NEON_AUTH_URL pointing to Neon while auth is still served by Neon.

   Do NOT commit real secrets to the repo. Add them to Vercel or your secret manager instead.

4) Client usage

   - Use `src/lib/supabase/client.ts` (created) for shared helpers:
     - `supabaseBrowser` for browser-side operations
     - `createSupabaseServerClient()` to create a server-side client using the service role key

5) Migration notes

   - Follow the migration runbook: apply Drizzle schema to Supabase direct URL, then do a data-only dump from Neon and restore into Supabase (disable triggers during restore).
   - Update `sync-auth-users` cron to read Neon auth and write to Supabase public.user (two DB connections).

6) Runtime

   - Use the Supabase pooled URL (port 6543) as the app's DATABASE_URL in Vercel for runtime.
   - Keep Neon project alive for auth reads until you decommission.

