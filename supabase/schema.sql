-- Health Trust schema for a future Supabase project.
-- Run this in the SQL editor when you are ready. Auth tables on Supabase
-- are managed by Supabase Auth; this file is the product tables only.

create table if not exists profiles (
  user_id text primary key,
  username text unique,
  username_locked boolean not null default false,
  full_name text,
  phone text,
  role text not null default 'member',
  referral_code text unique not null,
  referred_by text,
  created_at timestamptz not null default now()
);

create table if not exists wallets (
  user_id text primary key,
  health_balance numeric(14,2) not null default 0,
  account_number text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id serial primary key,
  user_id text not null,
  tier text not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  quota_percent numeric(5,2) not null default 100,
  next_refresh_at timestamptz not null,
  active boolean not null default true
);

create table if not exists care_codes (
  id serial primary key,
  user_id text not null,
  code text unique not null,
  allocated_percent numeric(5,2) not null,
  remaining_percent numeric(5,2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists wallet_tx (
  id serial primary key,
  user_id text not null,
  amount numeric(14,2) not null,
  kind text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id serial primary key,
  user_id text not null,
  kind text not null,
  duration_min integer not null,
  scheduled_at timestamptz not null,
  health_cost numeric(14,2) not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists appointment_cards (
  id serial primary key,
  user_id text not null,
  card_type text not null,
  health_cost numeric(14,2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists referrals (
  id serial primary key,
  referrer_id text not null,
  referred_id text not null unique,
  percent numeric(5,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists enquiries (
  id serial primary key,
  user_id text,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists hospital_updates (
  id serial primary key,
  title text not null,
  slug text unique not null,
  excerpt text not null,
  body text not null,
  kind text not null default 'news',
  published_at timestamptz not null default now()
);

create table if not exists audit_log (
  id serial primary key,
  actor_username text not null,
  action text not null,
  details text not null,
  created_at timestamptz not null default now()
);
