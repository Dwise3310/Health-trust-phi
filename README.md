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
6. `supabase/06-logic.sql`
7. `supabase/07-codes.sql`
8. Do not paste `08-admin.sql` as one blob. The editor cuts it off. Run these one at a time:
   - `supabase/08a-tables.sql`
   - `supabase/08b-totp.sql`
   - `supabase/08c-access.sql`
   - `supabase/08d-analytics.sql`
   - `supabase/08e-queues.sql`
   - `supabase/08f-roles.sql`
   - `supabase/08g-hooks.sql`
   - `supabase/08h-grants.sql`
9. `supabase/09-admin-user.sql`
10. `supabase/10a-analytics.sql`
11. `supabase/10b-sync.sql`

Part 9 stores the bootstrap super admin in the database.
The email and password are in that SQL file, not in the app.
The first sign-in asks you to turn on an authenticator app.

If the staff desk is already open, do not re-run parts 1 to 9.
Run only these two, in order:

- `supabase/10a-analytics.sql` (stops the analytics spinner)
- `supabase/10b-sync.sql` (print slips, charts, delivery, card codes, staff passwords)

If the member site already works and you have not opened the staff desk yet, run 08a through 08h, then part 9, then 10a and 10b.
Do not re-run part 1.

If login already works and features say `permission denied for table`, run
**only** `supabase/05-grants.sql`. Do not re-run part 1.

If issuing a Care Quota code says `gen_random_bytes` does not exist, run
**only** `supabase/07-codes.sql`.

Sessions last 5 days of no visit. Opening the site again while the cookie is valid returns you to the member desk without another login.

Vercel should detect Next.js automatically. Hobby deploys must come from the GitHub owner of this repo.
