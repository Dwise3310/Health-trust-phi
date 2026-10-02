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

Set these environment variables, then redeploy:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (`https://health-trust-phi.vercel.app`)

In Supabase Auth, add the same site URL plus `https://health-trust-phi.vercel.app/auth/callback` as a redirect.

## Database

Run `supabase/schema.sql` in the Supabase SQL editor. It creates profiles, wallets (with a unique `SH` account number), Care Quota tables, staff roles, and RLS.

If you already ran an earlier schema, run the file again. Table creates are `if not exists`. Account and referral functions are replaced so new members get `SH` numbers.

Email confirmation can stay on. Sign up asks people to verify their email before the account is created.

Vercel should detect Next.js automatically. Hobby deploys must come from the GitHub owner of this repo.
