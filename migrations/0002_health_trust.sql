-- Health Trust core schema
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
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);

create table if not exists care_codes (
  id serial primary key,
  user_id text not null,
  code text unique not null,
  allocated_percent numeric(5,2) not null,
  remaining_percent numeric(5,2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists care_codes_user_id_idx on care_codes (user_id);
create index if not exists care_codes_code_idx on care_codes (code);

create table if not exists wallet_tx (
  id serial primary key,
  user_id text not null,
  amount numeric(14,2) not null,
  kind text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists wallet_tx_user_id_idx on wallet_tx (user_id);

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
create index if not exists appointments_user_id_idx on appointments (user_id);

create table if not exists appointment_cards (
  id serial primary key,
  user_id text not null,
  card_type text not null,
  health_cost numeric(14,2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists appointment_cards_user_id_idx on appointment_cards (user_id);

create table if not exists referrals (
  id serial primary key,
  referrer_id text not null,
  referred_id text not null unique,
  percent numeric(5,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists referrals_referrer_id_idx on referrals (referrer_id);

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

insert into hospital_updates (title, slug, excerpt, body, kind)
values
  (
    'Health Trust opens membership at Eastern Ryse',
    'health-trust-opens',
    'FarmGreat West Africa partners with Eastern Ryse Specialist Hospital to make quality care reachable.',
    'Health Trust is a membership programme hosted by FarmGreat West Africa LLC in partnership with Eastern Ryse Specialist Hospital. Members receive a Care Quota that covers consultation, basic diagnosis, and follow-up advice, with priority based on tier.',
    'news'
  ),
  (
    'How Care Quota works on a visit',
    'how-care-quota-works',
    'Generate a code, present it at reception, and the consultant confirms spendable cover.',
    'Members generate a Care Quota code from their dashboard and allocate a percentage of remaining cover. Reception verifies the code, prints a slip, and the consultant confirms eligible services before debiting the remaining percentage.',
    'education'
  ),
  (
    'Malaria follow-up without the queue tax',
    'malaria-follow-up',
    'A typical walk-through of using a shared Care Quota code for a family member.',
    'A Prime member can allocate a portion of Care Quota to a family member. The visitor is attended according to the generator’s tier, including access to the Prime waiting area when presenting a Prime-issued code.',
    'case'
  )
on conflict (slug) do nothing;
