-- Sure Health · part 3 of 4
-- Rest of the product tables. Run AFTER 02-core.sql succeeds.

create table public.subscriptions (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('base', 'plus', 'prime')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  quota_percent numeric(5, 2) not null default 100,
  quota_remaining numeric(5, 2) not null default 100,
  next_refresh_at timestamptz not null,
  active boolean not null default true
);

create table public.care_codes (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text unique not null,
  allocated_percent numeric(5, 2) not null,
  remaining_percent numeric(5, 2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.wallet_tx (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null,
  kind text not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.appointments (
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

create table public.appointment_cards (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_type text not null check (card_type in ('normal', 'vip')),
  health_cost numeric(14, 2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.referrals (
  id bigserial primary key,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null unique references public.profiles (id) on delete cascade,
  percent numeric(5, 2) not null,
  created_at timestamptz not null default now()
);

create table public.enquiries (
  id bigserial primary key,
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.deletion_requests (
  id bigserial primary key,
  email text not null,
  reason text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.user_missions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create table public.roles (
  id bigserial primary key,
  name text unique not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  id bigserial primary key,
  role_id bigint not null references public.roles (id) on delete cascade,
  permission text not null,
  unique (role_id, permission)
);

create table public.staff_invites (
  id bigserial primary key,
  email text not null,
  role_id bigint not null references public.roles (id) on delete cascade,
  invited_by uuid references public.profiles (id),
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  actor_username text not null,
  action text not null,
  details text not null,
  created_at timestamptz not null default now()
);
