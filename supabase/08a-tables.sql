-- Sure Health · 08a-tables.sql
-- Run this AFTER the previous part. Does not drop members. Safe to run again.
-- Tables, indexes, and row security.

-- Sure Health · part 8
-- Staff desk, 2FA, queues, analytics, roles, logo.
-- Does not drop members. Safe to run again.
-- Run 09-admin-user.sql after this. That file stores the super admin login.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.admin_allowlist (
  email text primary key,
  is_super boolean not null default false,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_assignments (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role_id bigint not null references public.roles (id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_security (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  totp_secret text,
  totp_enabled boolean not null default false,
  verified_until timestamptz,
  failed_count int not null default 0,
  locked_until timestamptz
);

create table if not exists public.desk_requests (
  id bigserial primary key,
  kind text not null,
  ref_id text,
  user_id uuid,
  title text not null,
  detail text,
  amount numeric(14, 2),
  status text not null default 'open',
  reply text,
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, ref_id)
);

create index if not exists desk_requests_kind_status_idx
  on public.desk_requests (kind, status, created_at desc);

create table if not exists public.site_events (
  id bigserial primary key,
  path text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists site_events_created_idx on public.site_events (created_at);

create table if not exists public.member_activity (
  user_id uuid not null references public.profiles (id) on delete cascade,
  seen_on date not null,
  hits int not null default 1,
  primary key (user_id, seen_on)
);

create table if not exists public.hospital_brand (
  id int primary key default 1 check (id = 1),
  logo_url text,
  updated_at timestamptz not null default now()
);

insert into public.hospital_brand (id) values (1) on conflict (id) do nothing;

alter table public.admin_allowlist enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.staff_security enable row level security;
alter table public.desk_requests enable row level security;
alter table public.site_events enable row level security;
alter table public.member_activity enable row level security;
alter table public.hospital_brand enable row level security;

