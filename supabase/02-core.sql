-- Sure Health · part 2 of 4
-- Profiles, wallets, and the signup trigger.
-- Run AFTER 01-reset.sql succeeds.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  username_locked boolean not null default false,
  full_name text,
  phone text,
  avatar_url text,
  date_of_birth date,
  gender text,
  nationality text default 'Nigeria',
  state_of_origin text,
  lga text,
  address text,
  blood_group text,
  genotype text,
  next_of_kin_name text,
  next_of_kin_phone text,
  occupation text,
  notify_email boolean not null default true,
  notify_sms boolean not null default false,
  role text not null default 'member',
  referral_code text unique not null,
  referred_by text,
  created_at timestamptz not null default now()
);

create table public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  health_balance numeric(14, 2) not null default 0,
  account_number text unique not null,
  bank_name text,
  bank_account text,
  bank_account_name text,
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If you already signed up before this SQL, give those users a profile and wallet.
do $$
declare
  r record;
begin
  for r in
    select id, raw_user_meta_data
    from auth.users
    where id not in (select id from public.profiles)
  loop
    insert into public.profiles (id, full_name, phone, referral_code)
    values (
      r.id,
      coalesce(r.raw_user_meta_data->>'full_name', ''),
      coalesce(r.raw_user_meta_data->>'phone', ''),
      public.sh_referral_code()
    );
    insert into public.wallets (user_id, account_number)
    values (r.id, public.sh_account_number())
    on conflict do nothing;
  end loop;
end $$;
