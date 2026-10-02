-- Sure Health · run in the Supabase SQL editor (production).
-- Auth users live in auth.users. This file is product tables + RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  username_locked boolean not null default false,
  full_name text,
  phone text,
  role text not null default 'member',
  referral_code text unique not null,
  referred_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  health_balance numeric(14, 2) not null default 0,
  account_number text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('base', 'plus', 'prime')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  quota_percent numeric(5, 2) not null default 100,
  next_refresh_at timestamptz not null,
  active boolean not null default true
);

create table if not exists public.care_codes (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text unique not null,
  allocated_percent numeric(5, 2) not null,
  remaining_percent numeric(5, 2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_tx (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null,
  kind text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('physical', 'audio')),
  duration_min integer not null,
  scheduled_at timestamptz not null,
  health_cost numeric(14, 2) not null,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_cards (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_type text not null check (card_type in ('normal', 'vip')),
  health_cost numeric(14, 2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id bigserial primary key,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  percent numeric(5, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.enquiries (
  id bigserial primary key,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deletion_requests (
  id bigserial primary key,
  email text not null,
  reason text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id bigserial primary key,
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id bigserial primary key,
  role_id bigint not null references public.roles (id) on delete cascade,
  permission text not null,
  unique (role_id, permission)
);

create table if not exists public.staff_invites (
  id bigserial primary key,
  email text not null,
  role_id bigint not null references public.roles (id) on delete cascade,
  invited_by uuid references public.profiles (id),
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  actor_username text not null,
  action text not null,
  details text not null,
  created_at timestamptz not null default now()
);

create or replace function public.sh_account_number()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'SH' || lpad((floor(random() * 10000000000))::bigint::text, 10, '0');
    exit when not exists (select 1 from public.wallets where account_number = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.sh_referral_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'SH-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    public.sh_referral_code()
  );

  insert into public.wallets (user_id, account_number)
  values (new.id, public.sh_account_number());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.care_codes enable row level security;
alter table public.wallet_tx enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_cards enable row level security;
alter table public.referrals enable row level security;
alter table public.enquiries enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_invites enable row level security;
alter table public.audit_log enable row level security;

create policy "own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "own wallet" on public.wallets
  for select using (auth.uid() = user_id);

create policy "own subs" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "own codes" on public.care_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tx" on public.wallet_tx
  for select using (auth.uid() = user_id);

create policy "own appointments" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own cards" on public.appointment_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own referrals" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "insert enquiry" on public.enquiries
  for insert with check (true);

create policy "insert deletion" on public.deletion_requests
  for insert with check (true);
