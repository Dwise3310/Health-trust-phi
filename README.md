# Sure Health

Independent web app for Sure Health at Eastern Ryse Specialist Hospital, sponsored by FarmGreat West Africa LLC.

Stack: Next.js on Vercel, Supabase for auth and data. Email and password
sign in is live. Google sign in is on the form; connect the Google client
in Supabase Auth whenn the hospital keys are ready.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Vercel

Keep only these environment variables, then redeploy:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (`https://health-trust-phi.vercel.app`)

Old keys from the first scaffold (`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `VITE_AUTH_ENABLED`) are leftover. They do nothing on this app. You can delete them.

In Supabase Auth, set Site URL to the Vercel domain and add:

- `https://health-trust-phi.vercel.app/**`
- `https://health-trust-phi.vercel.app/auth/callback`

## Database

Run these files in the Supabase SQL editor, in order, on a fresh project:

1. `supabase/01-reset.sql`
2. `supabase/02-core.sql`
3. `supabase/03-tables.sql`
4. `supabase/04-rls.sql`
5. `supabase/05-grants.sql`

If login already works and features say `permission denied for table`, run
**only** `supabase/05-grants.sql`. Do not re-run part 1.

Then run `supabase/06-logic.sql`. That file sets Care Quota to 100% full,
blocks plan downgrades while a plan is live, resets missions, and adds
issue/cancel code, product, card, and visit money functions.

Sessions last 5 days of no visit. Opening the site again while the cookie is valid returns you to the member desk without another login.

Vercel should detect Next.js automatically. Hobby deploys must come from the GitHub owner of this repo.
