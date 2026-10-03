# Sure Health

Independent web app for Sure Health at Eastern Ryse Specialist Hospital, sponsored by FarmGreat West Africa LLC.

Stack: Next.js on Vercel, Supabase for auth and data. Email and password
sign in is live. Google sign in is on the form; connect the Google client
in Supabase Auth when the hospital keys are ready.

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

Run these four files in the Supabase SQL editor, in order. Do not paste the old one-shot `schema.sql`.

1. `supabase/01-reset.sql`
2. `supabase/02-core.sql`
3. `supabase/03-tables.sql`
4. `supabase/04-rls.sql`

Part 1 drops the broken older tables that caused `column "id" referenced in foreign key constraint does not exist`. Part 2 creates profiles, wallets, and the signup trigger. Part 3 creates the rest. Part 4 turns on row security and the avatar bucket.

After SQL, a new signup creates a profile, a wallet, and a unique `SH` account number. Existing auth users are backfilled in part 2.

Sessions last 5 days of no visit. Opening the site again while the cookie is valid returns you to the member desk without another login.

Vercel should detect Next.js automatically. Hobby deploys must come from the GitHub owner of this repo.
