# Health Trust

Independent web app for Health Trust at Eastern Ryse Specialist Hospital, sponsored by FarmGreat West Africa LLC.

Stack: Next.js on Vercel, Supabase for auth and data. Email and password
auth only. No third-party social login brokers.

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

Run `supabase/schema.sql` in the Supabase SQL editor. It creates profiles, wallets (with a unique `HT` account number), Care Quota tables, staff roles, and RLS.

Email confirmation can stay on. The login screen tells people to check their inbox.
