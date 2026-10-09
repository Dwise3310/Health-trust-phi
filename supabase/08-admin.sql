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

-- ---------------------------------------------------------------------------
-- TOTP (authenticator apps). search_path includes extensions for hmac.
-- ---------------------------------------------------------------------------

create or replace function public.sh_base32_decode(p_in text)
returns bytea
language plpgsql
immutable
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  clean text;
  buffer bigint := 0;
  bits int := 0;
  i int;
  val int;
  out bytea := ''::bytea;
begin
  clean := upper(regexp_replace(coalesce(p_in, ''), '[^A-Z2-7]', '', 'g'));
  for i in 1..length(clean) loop
    val := position(substr(clean, i, 1) in alphabet) - 1;
    if val < 0 then
      continue;
    end if;
    buffer := (buffer << 5) | val;
    bits := bits + 5;
    if bits >= 8 then
      bits := bits - 8;
      out := out || set_byte('\x00'::bytea, 0, ((buffer >> bits) & 255)::int);
    end if;
  end loop;
  return out;
end;
$$;

create or replace function public.sh_hotp(p_key bytea, p_counter bigint)
returns text
language plpgsql
immutable
set search_path = public, extensions
as $$
declare
  msg bytea;
  mac bytea;
  mac_offset int;
  bin bigint;
begin
  msg := substring(int8send(p_counter) from 1 for 8);
  mac := hmac(msg, p_key, 'sha1');
  mac_offset := get_byte(mac, 19) & 15;
  bin := ((get_byte(mac, mac_offset) & 127)::bigint << 24)
      | (get_byte(mac, mac_offset + 1)::bigint << 16)
      | (get_byte(mac, mac_offset + 2)::bigint << 8)
      | get_byte(mac, mac_offset + 3)::bigint;
  return lpad((bin % 1000000)::text, 6, '0');
end;
$$;

create or replace function public.sh_totp_match(p_secret text, p_code text)
returns boolean
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  key bytea;
  counter bigint;
  step int;
  got text;
begin
  got := lpad(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), 6, '0');
  if length(got) <> 6 or p_secret is null or p_secret = '' then
    return false;
  end if;
  key := public.sh_base32_decode(p_secret);
  if key is null or octet_length(key) < 10 then
    return false;
  end if;
  counter := floor(extract(epoch from now()) / 30)::bigint;
  for step in -1..1 loop
    if public.sh_hotp(key, counter + step) = got then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

create or replace function public.sh_random_base32(p_len int)
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  out text := '';
  i int;
begin
  for i in 1..p_len loop
    out := out || substr(alphabet, 1 + floor(random() * 32)::int, 1);
  end loop;
  return out;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who is at the desk
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_email()
returns text
language sql
stable
security definer
set search_path = public, extensions
as $$
  select lower(email) from auth.users where id = auth.uid();
$$;

create or replace function public.sh_admin_claim_invites()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  em text;
  rid bigint;
begin
  if uid is null then
    return;
  end if;
  if not exists (select 1 from public.profiles where id = uid) then
    return;
  end if;
  em := public.sh_admin_email();
  select i.role_id into rid
  from public.staff_invites i
  where lower(i.email) = em
  order by i.created_at desc
  limit 1;
  if rid is null then
    return;
  end if;
  insert into public.staff_assignments (user_id, role_id, active)
  values (uid, rid, true)
  on conflict (user_id) do update
    set role_id = excluded.role_id, active = true;
  update public.staff_invites
    set accepted = true
    where lower(email) = em;
  update public.profiles set role = 'staff' where id = uid and role = 'member';
end;
$$;

create or replace function public.sh_admin_is_allowed()
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  em text := public.sh_admin_email();
begin
  if auth.uid() is null or em is null then
    return false;
  end if;
  if exists (
    select 1 from public.admin_allowlist a
    where a.email = em and a.active
  ) then
    return true;
  end if;
  if exists (
    select 1 from public.staff_assignments s
    where s.user_id = auth.uid() and s.active
  ) then
    return true;
  end if;
  return exists (
    select 1 from public.staff_invites i
    where lower(i.email) = em
  );
end;
$$;

create or replace function public.sh_admin_is_super()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.admin_allowlist a
    where a.email = public.sh_admin_email() and a.active and a.is_super
  );
$$;

create or replace function public.sh_admin_verified()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.staff_security s
    where s.user_id = auth.uid()
      and s.totp_enabled
      and s.verified_until is not null
      and s.verified_until > now()
  );
$$;

create or replace function public.sh_admin_can(p_perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.sh_admin_is_allowed() or not public.sh_admin_verified() then
    return false;
  end if;
  if public.sh_admin_is_super() then
    return true;
  end if;
  return exists (
    select 1
    from public.staff_assignments s
    join public.role_permissions p on p.role_id = s.role_id
    where s.user_id = auth.uid()
      and s.active
      and p.permission = p_perm
  );
end;
$$;

create or replace function public.sh_admin_perms()
returns text[]
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  all_perms text[] := array[
    'analytics.view',
    'withdrawals.manage',
    'visits.manage',
    'pharmacy.manage',
    'cards.manage',
    'enquiries.reply',
    'deletions.manage',
    'codes.check',
    'patients.view',
    'roles.manage',
    'branding.manage',
    'audit.view'
  ];
begin
  if public.sh_admin_is_super() then
    return all_perms;
  end if;
  return coalesce(array(
    select distinct p.permission
    from public.staff_assignments s
    join public.role_permissions p on p.role_id = s.role_id
    where s.user_id = auth.uid() and s.active
  ), array[]::text[]);
end;
$$;

create or replace function public.sh_admin_require(p_perm text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.sh_admin_is_allowed() then
    raise exception 'This door is for hospital staff';
  end if;
  if not public.sh_admin_verified() then
    raise exception 'Enter your authenticator code first';
  end if;
  if not public.sh_admin_can(p_perm) then
    raise exception 'Your role cannot do that';
  end if;
end;
$$;

create or replace function public.sh_admin_audit(p_action text, p_details text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  em text := coalesce(public.sh_admin_email(), 'staff');
begin
  insert into public.audit_log (actor_id, actor_username, action, details)
  values (auth.uid(), em, p_action, left(coalesce(p_details, ''), 500));
end;
$$;

create or replace function public.sh_admin_status()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  em text;
  nm text;
  enabled boolean := false;
begin
  if uid is null then
    return json_build_object('allowed', false);
  end if;
  perform public.sh_admin_claim_invites();
  em := public.sh_admin_email();
  if not public.sh_admin_is_allowed() then
    return json_build_object('allowed', false, 'email', em);
  end if;
  select full_name into nm from public.profiles where id = uid;
  select totp_enabled into enabled from public.staff_security where user_id = uid;
  return json_build_object(
    'allowed', true,
    'super', public.sh_admin_is_super(),
    'email', em,
    'name', coalesce(nm, 'Staff'),
    'permissions', public.sh_admin_perms(),
    'totp_enabled', coalesce(enabled, false),
    'verified', public.sh_admin_verified()
  );
end;
$$;

create or replace function public.sh_admin_lock()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.staff_security
    set verified_until = null
    where user_id = auth.uid();
end;
$$;

create or replace function public.sh_admin_enroll_totp()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  em text;
  secret text;
  enabled boolean;
begin
  if uid is null or not public.sh_admin_is_allowed() then
    raise exception 'This door is for hospital staff';
  end if;
  em := public.sh_admin_email();
  insert into public.staff_security (user_id)
  values (uid)
  on conflict (user_id) do nothing;

  select totp_secret, totp_enabled into secret, enabled
  from public.staff_security where user_id = uid;

  if enabled then
    raise exception 'Authenticator is already on. Enter the current code.';
  end if;
  if secret is null or secret = '' then
    secret := public.sh_random_base32(32);
    update public.staff_security set totp_secret = secret where user_id = uid;
  end if;

  return json_build_object(
    'secret', secret,
    'otpauth',
      'otpauth://totp/Sure%20Health:' || replace(em, '@', '%40')
      || '?secret=' || secret
      || '&issuer=Sure%20Health&digits=6&period=30'
  );
end;
$$;

create or replace function public.sh_admin_check_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  secret text;
  fails int;
  locked timestamptz;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  select totp_secret, failed_count, locked_until
    into secret, fails, locked
  from public.staff_security where user_id = uid;

  if locked is not null and locked > now() then
    raise exception 'Too many wrong codes. Wait a few minutes.';
  end if;
  if secret is null or not public.sh_totp_match(secret, p_code) then
    fails := coalesce(fails, 0) + 1;
    update public.staff_security
      set failed_count = case when fails >= 8 then 0 else fails end,
          locked_until = case
            when fails >= 8 then now() + interval '10 minutes'
            else locked_until
          end
    where user_id = uid;
    raise exception 'That code is not right';
  end if;
  update public.staff_security
    set failed_count = 0, locked_until = null
    where user_id = uid;
end;
$$;

create or replace function public.sh_admin_confirm_totp(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.sh_admin_is_allowed() then
    raise exception 'This door is for hospital staff';
  end if;
  perform public.sh_admin_check_code(p_code);
  update public.staff_security
    set totp_enabled = true,
        verified_until = now() + interval '12 hours'
    where user_id = auth.uid();
  perform public.sh_admin_audit('totp_on', 'Authenticator turned on');
  return public.sh_admin_status();
end;
$$;

create or replace function public.sh_admin_verify_totp(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.sh_admin_is_allowed() then
    raise exception 'This door is for hospital staff';
  end if;
  if not exists (
    select 1 from public.staff_security
    where user_id = auth.uid() and totp_enabled
  ) then
    raise exception 'Set up the authenticator first';
  end if;
  perform public.sh_admin_check_code(p_code);
  update public.staff_security
    set verified_until = now() + interval '12 hours'
    where user_id = auth.uid();
  perform public.sh_admin_audit('totp_ok', 'Staff desk unlocked');
  return public.sh_admin_status();
end;
$$;

-- ---------------------------------------------------------------------------
-- Analytics and usage
-- ---------------------------------------------------------------------------

create or replace function public.sh_track_view(p_path text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.site_events (path, user_id)
  values (left(coalesce(p_path, '/'), 180), auth.uid());
end;
$$;

create or replace function public.sh_touch_member()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then
    return;
  end if;
  insert into public.member_activity (user_id, seen_on, hits)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, seen_on) do update
    set hits = public.member_activity.hits + 1;
end;
$$;

create or replace function public.sh_admin_analytics(p_from date, p_to date)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  d0 date := coalesce(p_from, current_date - 29);
  d1 date := coalesce(p_to, current_date);
  result json;
begin
  perform public.sh_admin_require('analytics.view');
  if d1 < d0 then
    raise exception 'End date is before the start date';
  end if;
  if d1 - d0 > 366 then
    raise exception 'Pick a range of a year or less';
  end if;

  select json_build_object(
    'from', d0,
    'to', d1,
    'total_users', (select count(*) from public.profiles),
    'new_users', (
      select count(*) from public.profiles
      where created_at >= d0 and created_at < d1 + 1
    ),
    'dau', (
      select count(*) from public.member_activity where seen_on = current_date
    ),
    'mau', (
      select count(distinct user_id) from public.member_activity
      where seen_on > current_date - 30 and seen_on <= current_date
    ),
    'active_in_range', (
      select count(distinct user_id) from public.member_activity
      where seen_on >= d0 and seen_on <= d1
    ),
    'views', (
      select count(*) from public.site_events
      where created_at >= d0 and created_at < d1 + 1
    ),
    'unique_members', (
      select count(distinct user_id) from public.site_events
      where user_id is not null
        and created_at >= d0 and created_at < d1 + 1
    ),
    'revenue_health', coalesce((
      select sum(-amount) from public.wallet_tx
      where amount < 0
        and kind in ('membership', 'product', 'card', 'appointment', 'visit')
        and created_at >= d0 and created_at < d1 + 1
    ), 0),
    'sales_count', (
      select count(*) from public.wallet_tx
      where amount < 0
        and kind in ('membership', 'product', 'card', 'appointment', 'visit')
        and created_at >= d0 and created_at < d1 + 1
    ),
    'deposits_health', coalesce((
      select sum(amount) from public.wallet_tx
      where amount > 0
        and kind in ('deposit', 'test_credit')
        and created_at >= d0 and created_at < d1 + 1
    ), 0),
    'withdraw_health', coalesce((
      select sum(-amount) from public.wallet_tx
      where kind = 'withdraw_request'
        and created_at >= d0 and created_at < d1 + 1
    ), 0),
    'open_withdrawals', (select count(*) from public.desk_requests where kind = 'withdraw' and status = 'open'),
    'open_pharmacy', (select count(*) from public.desk_requests where kind = 'pharmacy' and status = 'open'),
    'open_visits', (select count(*) from public.desk_requests where kind = 'visit' and status in ('open', 'confirmed')),
    'open_cards', (select count(*) from public.desk_requests where kind = 'card' and status = 'open'),
    'open_enquiries', (select count(*) from public.desk_requests where kind = 'enquiry' and status = 'open'),
    'tiers', (
      select json_build_object(
        'base', count(*) filter (where tier = 'base' and active and expires_at > now()),
        'plus', count(*) filter (where tier = 'plus' and active and expires_at > now()),
        'prime', count(*) filter (where tier = 'prime' and active and expires_at > now())
      )
      from public.subscriptions
    ),
    'days', (
      select coalesce(json_agg(row_to_json(x) order by x.day), '[]'::json)
      from (
        select
          gs::date as day,
          (select count(*) from public.site_events e where e.created_at >= gs and e.created_at < gs + 1) as views,
          (select count(*) from public.profiles p where p.created_at >= gs and p.created_at < gs + 1) as signups,
          coalesce((
            select sum(-amount) from public.wallet_tx t
            where t.amount < 0
              and t.kind in ('membership', 'product', 'card', 'appointment', 'visit')
              and t.created_at >= gs and t.created_at < gs + 1
          ), 0) as revenue,
          coalesce((
            select sum(amount) from public.wallet_tx t
            where t.amount > 0
              and t.kind in ('deposit', 'test_credit')
              and t.created_at >= gs and t.created_at < gs + 1
          ), 0) as deposits,
          (
            select count(*) from public.wallet_tx t
            where t.amount < 0
              and t.kind in ('membership', 'product', 'card', 'appointment', 'visit')
              and t.created_at >= gs and t.created_at < gs + 1
          ) as sales
        from generate_series(d0, d1, interval '1 day') as gs
      ) x
    )
  ) into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Queues
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_queue(p_kind text, p_status text default 'open')
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  need text;
begin
  need := case p_kind
    when 'withdraw' then 'withdrawals.manage'
    when 'pharmacy' then 'pharmacy.manage'
    when 'visit' then 'visits.manage'
    when 'card' then 'cards.manage'
    when 'enquiry' then 'enquiries.reply'
    when 'deletion' then 'deletions.manage'
    else null
  end;
  if need is null then
    raise exception 'Unknown queue';
  end if;
  perform public.sh_admin_require(need);

  return coalesce((
    select json_agg(row_to_json(q) order by q.sort_tier, q.created_at)
    from (
      select
        d.id,
        d.kind,
        d.user_id,
        coalesce(pr.full_name, 'Member') as member,
        coalesce(au.email, '') as email,
        coalesce(pr.phone, '') as phone,
        coalesce(sub.tier, 'none') as tier,
        d.title,
        d.detail,
        d.amount,
        d.status,
        d.reply,
        d.created_at,
        case coalesce(sub.tier, '')
          when 'prime' then 1
          when 'plus' then 2
          when 'base' then 3
          else 4
        end as sort_tier
      from public.desk_requests d
      left join public.profiles pr on pr.id = d.user_id
      left join auth.users au on au.id = d.user_id
      left join lateral (
        select s.tier
        from public.subscriptions s
        where s.user_id = d.user_id and s.active and s.expires_at > now()
        order by s.started_at desc
        limit 1
      ) sub on true
      where d.kind = p_kind
        and (
          p_status = 'all'
          or (p_status = 'open' and d.status in ('open', 'confirmed'))
          or (p_status = 'done' and d.status in ('done', 'rejected', 'replied'))
          or d.status = p_status
        )
      order by 14, d.created_at
      limit 100
    ) q
  ), '[]'::json);
end;
$$;

create or replace function public.sh_admin_act(p_id bigint, p_status text, p_reply text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  row public.desk_requests%rowtype;
  need text;
begin
  select * into row from public.desk_requests where id = p_id;
  if row.id is null then
    raise exception 'That item is gone';
  end if;
  need := case row.kind
    when 'withdraw' then 'withdrawals.manage'
    when 'pharmacy' then 'pharmacy.manage'
    when 'visit' then 'visits.manage'
    when 'card' then 'cards.manage'
    when 'enquiry' then 'enquiries.reply'
    when 'deletion' then 'deletions.manage'
    else null
  end;
  perform public.sh_admin_require(need);
  if p_status not in ('open', 'confirmed', 'done', 'rejected', 'replied') then
    raise exception 'Unknown status';
  end if;
  if row.kind = 'withdraw' and p_status = 'rejected' and row.status = 'open' then
    update public.wallets
      set health_balance = health_balance + coalesce(row.amount, 0)
      where user_id = row.user_id;
    insert into public.wallet_tx (user_id, amount, kind, note)
    values (
      row.user_id,
      coalesce(row.amount, 0),
      'withdraw_reject',
      'Withdrawal rejected and returned · ' || to_char(now(), 'DD Mon YYYY HH24:MI')
    );
  end if;
  if row.kind = 'withdraw' and p_status = 'rejected' and row.status <> 'open' then
    raise exception 'Only an open withdrawal can be returned';
  end if;

  update public.desk_requests
    set status = p_status,
        reply = nullif(left(coalesce(p_reply, ''), 800), ''),
        handled_by = auth.uid(),
        handled_at = now()
    where id = p_id;

  perform public.sh_admin_audit(
    'desk_' || row.kind,
    row.kind || ' #' || p_id || ' set to ' || p_status
      || case when coalesce(p_reply, '') = '' then '' else ' · ' || left(p_reply, 160) end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Reception: Care Quota code
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_lookup_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  result json;
  needle text := upper(trim(p_code));
begin
  perform public.sh_admin_require('codes.check');
  select json_build_object(
    'code', c.code,
    'status', c.status,
    'allocated', c.allocated_percent,
    'remaining', c.remaining_percent,
    'issued_at', c.created_at,
    'member', coalesce(pr.full_name, 'Member'),
    'email', coalesce(au.email, ''),
    'phone', coalesce(pr.phone, ''),
    'tier', coalesce(sub.tier, 'none'),
    'plan_quota', sub.quota_remaining,
    'account_number', w.account_number,
    'user_id', c.user_id
  ) into result
  from public.care_codes c
  join public.profiles pr on pr.id = c.user_id
  left join auth.users au on au.id = c.user_id
  left join public.wallets w on w.user_id = c.user_id
  left join lateral (
    select s.tier, s.quota_remaining
    from public.subscriptions s
    where s.user_id = c.user_id and s.active
    order by s.started_at desc
    limit 1
  ) sub on true
  where upper(c.code) = needle;

  if result is null then
    raise exception 'No Care Quota code matches that';
  end if;
  perform public.sh_admin_audit('code_lookup', needle);
  return result;
end;
$$;

create or replace function public.sh_admin_use_code(p_code text, p_percent numeric, p_note text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  needle text := upper(trim(p_code));
  left_q numeric;
  uid uuid;
begin
  perform public.sh_admin_require('codes.check');
  if p_percent is null or p_percent <= 0 then
    raise exception 'Enter how much of the code was used';
  end if;
  select remaining_percent, user_id into left_q, uid
  from public.care_codes
  where upper(code) = needle and status = 'active'
  for update;

  if uid is null then
    raise exception 'That code is not active';
  end if;
  if p_percent > left_q then
    raise exception 'Only % percent is left on this code', left_q;
  end if;

  update public.care_codes
    set remaining_percent = remaining_percent - p_percent,
        status = case when remaining_percent - p_percent <= 0 then 'used' else status end
    where upper(code) = needle;

  perform public.sh_admin_audit(
    'code_use',
    needle || ' used ' || p_percent || '% · ' || coalesce(p_note, '')
  );
  return public.sh_admin_lookup_code(needle);
end;
$$;

-- ---------------------------------------------------------------------------
-- Patient folder
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_patients(p_query text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  q text := lower(trim(coalesce(p_query, '')));
begin
  perform public.sh_admin_require('patients.view');
  return coalesce((
    select json_agg(row_to_json(x))
    from (
      select
        pr.id,
        coalesce(pr.full_name, 'Member') as member,
        coalesce(au.email, '') as email,
        coalesce(pr.phone, '') as phone,
        coalesce(sub.tier, 'none') as tier,
        coalesce(w.health_balance, 0) as balance,
        w.account_number
      from public.profiles pr
      left join auth.users au on au.id = pr.id
      left join public.wallets w on w.user_id = pr.id
      left join lateral (
        select s.tier from public.subscriptions s
        where s.user_id = pr.id and s.active and s.expires_at > now()
        order by s.started_at desc
        limit 1
      ) sub on true
      where q = ''
        or lower(coalesce(pr.full_name, '')) like '%' || q || '%'
        or lower(coalesce(au.email, '')) like '%' || q || '%'
        or lower(coalesce(pr.phone, '')) like '%' || q || '%'
        or lower(coalesce(w.account_number, '')) like '%' || q || '%'
        or exists (
          select 1 from public.care_codes c
          where c.user_id = pr.id and lower(c.code) like '%' || q || '%'
        )
      order by pr.created_at desc
      limit 25
    ) x
  ), '[]'::json);
end;
$$;

create or replace function public.sh_admin_patient(p_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  result json;
begin
  perform public.sh_admin_require('patients.view');
  select json_build_object(
    'id', pr.id,
    'member', coalesce(pr.full_name, 'Member'),
    'email', coalesce(au.email, ''),
    'phone', coalesce(pr.phone, ''),
    'username', pr.username,
    'dob', pr.date_of_birth,
    'gender', pr.gender,
    'nationality', pr.nationality,
    'state', pr.state_of_origin,
    'address', pr.address,
    'blood_group', pr.blood_group,
    'genotype', pr.genotype,
    'kin', pr.next_of_kin_name,
    'kin_phone', pr.next_of_kin_phone,
    'balance', coalesce(w.health_balance, 0),
    'account_number', w.account_number,
    'bank_name', w.bank_name,
    'bank_account', w.bank_account,
    'bank_account_name', w.bank_account_name,
    'tier', sub.tier,
    'quota', sub.quota_remaining,
    'expires', sub.expires_at,
    'codes', coalesce((
      select json_agg(json_build_object(
        'code', c.code,
        'allocated', c.allocated_percent,
        'remaining', c.remaining_percent,
        'status', c.status,
        'issued_at', c.created_at
      ) order by c.created_at desc)
      from public.care_codes c where c.user_id = pr.id
    ), '[]'::json),
    'visits', coalesce((
      select json_agg(json_build_object(
        'kind', a.kind,
        'when', a.scheduled_at,
        'minutes', a.duration_min,
        'status', a.status,
        'cost', a.health_cost,
        'notes', a.notes
      ) order by a.scheduled_at desc)
      from public.appointments a where a.user_id = pr.id
    ), '[]'::json),
    'tx', coalesce((
      select json_agg(json_build_object(
        'amount', t.amount,
        'kind', t.kind,
        'note', t.note,
        'at', t.created_at
      ) order by t.created_at desc)
      from (
        select * from public.wallet_tx where user_id = pr.id order by created_at desc limit 20
      ) t
    ), '[]'::json)
  ) into result
  from public.profiles pr
  left join auth.users au on au.id = pr.id
  left join public.wallets w on w.user_id = pr.id
  left join lateral (
    select s.tier, s.quota_remaining, s.expires_at
    from public.subscriptions s
    where s.user_id = pr.id and s.active
    order by s.started_at desc
    limit 1
  ) sub on true
  where pr.id = p_id;

  if result is null then
    raise exception 'Member not found';
  end if;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_roles()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.sh_admin_require('roles.manage');
  return json_build_object(
    'roles', coalesce((
      select json_agg(json_build_object(
        'id', r.id,
        'name', r.name,
        'permissions', coalesce((
          select json_agg(p.permission order by p.permission)
          from public.role_permissions p where p.role_id = r.id
        ), '[]'::json)
      ) order by r.name)
      from public.roles r
    ), '[]'::json),
    'staff', coalesce((
      select json_agg(json_build_object(
        'user_id', s.user_id,
        'email', coalesce(au.email, ''),
        'name', coalesce(pr.full_name, 'Staff'),
        'role_id', s.role_id,
        'role_name', r.name,
        'active', s.active
      ) order by pr.full_name)
      from public.staff_assignments s
      join public.roles r on r.id = s.role_id
      join public.profiles pr on pr.id = s.user_id
      left join auth.users au on au.id = s.user_id
    ), '[]'::json),
    'invites', coalesce((
      select json_agg(json_build_object(
        'id', i.id,
        'email', i.email,
        'role_name', r.name,
        'accepted', i.accepted,
        'created_at', i.created_at
      ) order by i.created_at desc)
      from public.staff_invites i
      join public.roles r on r.id = i.role_id
    ), '[]'::json)
  );
end;
$$;

create or replace function public.sh_admin_create_role(p_name text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  nm text := trim(p_name);
begin
  perform public.sh_admin_require('roles.manage');
  if nm is null or length(nm) < 2 then
    raise exception 'Give the role a name';
  end if;
  insert into public.roles (name) values (nm);
  perform public.sh_admin_audit('role_create', nm);
end;
$$;

create or replace function public.sh_admin_set_permission(p_role_id bigint, p_permission text, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.sh_admin_require('roles.manage');
  if p_on then
    insert into public.role_permissions (role_id, permission)
    values (p_role_id, p_permission)
    on conflict (role_id, permission) do nothing;
  else
    delete from public.role_permissions
    where role_id = p_role_id and permission = p_permission;
  end if;
  perform public.sh_admin_audit(
    'role_perm',
    'role ' || p_role_id || ' ' || p_permission || ' ' || case when p_on then 'on' else 'off' end
  );
end;
$$;

create or replace function public.sh_admin_invite(p_email text, p_role_id bigint)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  em text := lower(trim(p_email));
  uid uuid;
begin
  perform public.sh_admin_require('roles.manage');
  if em is null or position('@' in em) = 0 then
    raise exception 'Enter a real email';
  end if;
  if not exists (select 1 from public.roles where id = p_role_id) then
    raise exception 'Pick a role';
  end if;
  insert into public.staff_invites (email, role_id, invited_by, accepted)
  values (em, p_role_id, auth.uid(), false);

  select id into uid from auth.users where lower(email) = em;
  if uid is not null and exists (select 1 from public.profiles where id = uid) then
    insert into public.staff_assignments (user_id, role_id, active)
    values (uid, p_role_id, true)
    on conflict (user_id) do update set role_id = excluded.role_id, active = true;
    update public.staff_invites set accepted = true where lower(email) = em;
    update public.profiles set role = 'staff' where id = uid and role = 'member';
  end if;
  perform public.sh_admin_audit('invite', em || ' role ' || p_role_id);
end;
$$;

create or replace function public.sh_admin_set_staff(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.sh_admin_require('roles.manage');
  update public.staff_assignments set active = p_active where user_id = p_user_id;
  perform public.sh_admin_audit(
    'staff_active',
    p_user_id::text || ' ' || case when p_active then 'on' else 'off' end
  );
end;
$$;

create or replace function public.sh_admin_reset_totp(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.sh_admin_is_super() or not public.sh_admin_verified() then
    raise exception 'Only the super admin can reset an authenticator';
  end if;
  update public.staff_security
    set totp_secret = null,
        totp_enabled = false,
        verified_until = null,
        failed_count = 0,
        locked_until = null
    where user_id = p_user_id;
  perform public.sh_admin_audit('totp_reset', p_user_id::text);
end;
$$;

create or replace function public.sh_admin_audit_list()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.sh_admin_require('audit.view');
  return coalesce((
    select json_agg(row_to_json(x))
    from (
      select actor_username, action, details, created_at
      from public.audit_log
      order by created_at desc
      limit 120
    ) x
  ), '[]'::json);
end;
$$;

-- ---------------------------------------------------------------------------
-- Logo
-- ---------------------------------------------------------------------------

create or replace function public.sh_public_brand()
returns json
language sql
stable
security definer
set search_path = public, extensions
as $$
  select json_build_object('logo_url', logo_url) from public.hospital_brand where id = 1;
$$;

create or replace function public.sh_admin_set_logo(p_url text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.sh_admin_require('branding.manage');
  update public.hospital_brand
    set logo_url = nullif(trim(p_url), ''), updated_at = now()
    where id = 1;
  perform public.sh_admin_audit('logo', coalesce(p_url, 'cleared'));
end;
$$;

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

drop policy if exists "branding public read" on storage.objects;
drop policy if exists "branding staff write" on storage.objects;
drop policy if exists "branding staff update" on storage.objects;

create policy "branding public read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding staff write" on storage.objects
  for insert with check (
    bucket_id = 'branding' and public.sh_admin_can('branding.manage')
  );

create policy "branding staff update" on storage.objects
  for update using (
    bucket_id = 'branding' and public.sh_admin_can('branding.manage')
  );

-- ---------------------------------------------------------------------------
-- New member actions also land on the desk
-- ---------------------------------------------------------------------------

create or replace function public.sh_request_withdraw(p_amount numeric, p_note text)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  bal numeric;
  next_bal numeric;
  tx_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid amount';
  end if;

  select health_balance into bal from public.wallets where user_id = auth.uid();
  if bal is null or bal < p_amount then
    raise exception 'Not enough Health';
  end if;

  update public.wallets
    set health_balance = health_balance - p_amount
    where user_id = auth.uid()
    returning health_balance into next_bal;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (auth.uid(), -p_amount, 'withdraw_request', coalesce(p_note, ''))
  returning id into tx_id;

  insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status)
  values (
    'withdraw',
    'tx-' || tx_id,
    auth.uid(),
    'Withdrawal',
    coalesce(p_note, ''),
    p_amount,
    'open'
  );

  return next_bal;
end;
$$;

create or replace function public.sh_buy_product(p_name text, p_sku text, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  bal numeric;
  next_bal numeric;
  tx_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid amount';
  end if;

  select health_balance into bal from public.wallets where user_id = auth.uid();
  if bal is null or bal < p_amount then
    raise exception 'Not enough Health';
  end if;

  update public.wallets
    set health_balance = health_balance - p_amount
    where user_id = auth.uid()
    returning health_balance into next_bal;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    -p_amount,
    'product',
    coalesce(p_name, 'Pharmacy item') || ' · SKU ' || coalesce(p_sku, '-') || ' · ' || p_amount || ' Health · ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  )
  returning id into tx_id;

  insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status)
  values (
    'pharmacy',
    'tx-' || tx_id,
    auth.uid(),
    coalesce(p_name, 'Pharmacy item'),
    'SKU ' || coalesce(p_sku, '-') || ' · ' || p_amount || ' Health',
    p_amount,
    'open'
  );

  return next_bal;
end;
$$;

create or replace function public.sh_buy_card(p_type text)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  cost numeric;
  next_bal numeric;
  card_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_type = 'vip' then
    cost := 90;
  else
    cost := 50;
    p_type := 'normal';
  end if;

  perform 1 from public.wallets where user_id = auth.uid() and health_balance >= cost;
  if not found then
    raise exception 'Not enough Health';
  end if;

  update public.wallets
    set health_balance = health_balance - cost
    where user_id = auth.uid()
    returning health_balance into next_bal;

  insert into public.appointment_cards (user_id, card_type, health_cost, status)
  values (auth.uid(), p_type, cost, 'active')
  returning id into card_id;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    -cost,
    'card',
    initcap(p_type) || ' digital appointment card · ' || cost || ' Health (₦' || (cost * 100) || ') · skip the paper queue · ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  );

  insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status)
  values (
    'card',
    'card-' || card_id,
    auth.uid(),
    initcap(p_type) || ' appointment card',
    cost || ' Health',
    cost,
    'open'
  );

  return next_bal;
end;
$$;

create or replace function public.sh_book_visit(p_kind text, p_minutes int, p_when timestamptz, p_note text, p_cost numeric)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  next_bal numeric;
  visit_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  perform 1 from public.wallets where user_id = auth.uid() and health_balance >= p_cost;
  if not found then
    raise exception 'Not enough Health';
  end if;

  update public.wallets
    set health_balance = health_balance - p_cost
    where user_id = auth.uid()
    returning health_balance into next_bal;

  insert into public.appointments (user_id, kind, duration_min, scheduled_at, health_cost, notes, status)
  values (auth.uid(), p_kind, p_minutes, p_when, p_cost, p_note, 'scheduled')
  returning id into visit_id;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    -p_cost,
    'appointment',
    case when p_kind = 'audio' then 'In-app audio call' else 'Physical visit' end
      || ' · ' || p_minutes || ' min · ' || to_char(p_when, 'DD Mon YYYY HH24:MI')
      || ' · ' || p_cost || ' Health'
  );

  insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status)
  values (
    'visit',
    'visit-' || visit_id,
    auth.uid(),
    case when p_kind = 'audio' then 'Audio call' else 'Physical visit' end,
    p_minutes || ' min · ' || to_char(p_when, 'DD Mon YYYY HH24:MI') || coalesce(' · ' || nullif(p_note, ''), ''),
    p_cost,
    'open'
  );

  return next_bal;
end;
$$;

create or replace function public.sh_enquiry_to_desk()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.desk_requests (kind, ref_id, user_id, title, detail, status)
  values (
    'enquiry',
    'enq-' || new.id,
    new.user_id,
    'Enquiry from ' || new.name,
    new.email || E'\n' || new.message,
    'open'
  )
  on conflict (kind, ref_id) do nothing;
  return new;
end;
$$;

drop trigger if exists enquiry_to_desk on public.enquiries;
create trigger enquiry_to_desk
  after insert on public.enquiries
  for each row execute function public.sh_enquiry_to_desk();

create or replace function public.sh_deletion_to_desk()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.desk_requests (kind, ref_id, user_id, title, detail, status)
  values (
    'deletion',
    'del-' || new.id,
    null,
    'Data deletion',
    new.email || coalesce(E'\n' || new.reason, ''),
    'open'
  )
  on conflict (kind, ref_id) do nothing;
  return new;
end;
$$;

drop trigger if exists deletion_to_desk on public.deletion_requests;
create trigger deletion_to_desk
  after insert on public.deletion_requests
  for each row execute function public.sh_deletion_to_desk();

-- Past rows the desk still needs to see.
insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status, created_at)
select
  'withdraw',
  'tx-' || t.id,
  t.user_id,
  'Withdrawal',
  t.note,
  abs(t.amount),
  'open',
  t.created_at
from public.wallet_tx t
where t.kind = 'withdraw_request'
on conflict (kind, ref_id) do nothing;

insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status, created_at)
select
  'pharmacy',
  'tx-' || t.id,
  t.user_id,
  'Pharmacy order',
  t.note,
  abs(t.amount),
  'open',
  t.created_at
from public.wallet_tx t
where t.kind = 'product'
on conflict (kind, ref_id) do nothing;

insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status, created_at)
select
  'visit',
  'visit-' || a.id,
  a.user_id,
  case when a.kind = 'audio' then 'Audio call' else 'Physical visit' end,
  a.duration_min || ' min · ' || to_char(a.scheduled_at, 'DD Mon YYYY HH24:MI') || coalesce(' · ' || a.notes, ''),
  a.health_cost,
  case when a.status = 'scheduled' then 'open' else a.status end,
  a.created_at
from public.appointments a
on conflict (kind, ref_id) do nothing;

insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status, created_at)
select
  'card',
  'card-' || c.id,
  c.user_id,
  initcap(c.card_type) || ' appointment card',
  c.health_cost || ' Health',
  c.health_cost,
  case when c.status = 'active' then 'open' else 'done' end,
  c.created_at
from public.appointment_cards c
on conflict (kind, ref_id) do nothing;

insert into public.desk_requests (kind, ref_id, user_id, title, detail, status, created_at)
select
  'enquiry',
  'enq-' || e.id,
  e.user_id,
  'Enquiry from ' || e.name,
  e.email || E'\n' || e.message,
  'open',
  e.created_at
from public.enquiries e
on conflict (kind, ref_id) do nothing;

insert into public.desk_requests (kind, ref_id, title, detail, status, created_at)
select
  'deletion',
  'del-' || d.id,
  'Data deletion',
  d.email || coalesce(E'\n' || d.reason, ''),
  case when d.status = 'open' then 'open' else 'done' end,
  d.created_at
from public.deletion_requests d
on conflict (kind, ref_id) do nothing;

-- ---------------------------------------------------------------------------
-- Default roles
-- ---------------------------------------------------------------------------

insert into public.roles (name) values
  ('Reception'),
  ('Pharmacy'),
  ('Clinician'),
  ('Finance')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission)
select r.id, p.perm
from public.roles r
join (values
  ('Reception', 'codes.check'),
  ('Reception', 'patients.view'),
  ('Reception', 'visits.manage'),
  ('Reception', 'cards.manage'),
  ('Pharmacy', 'pharmacy.manage'),
  ('Pharmacy', 'patients.view'),
  ('Clinician', 'visits.manage'),
  ('Clinician', 'patients.view'),
  ('Clinician', 'codes.check'),
  ('Finance', 'withdrawals.manage'),
  ('Finance', 'analytics.view'),
  ('Finance', 'audit.view')
) as p(name, perm) on p.name = r.name
on conflict (role_id, permission) do nothing;

-- ---------------------------------------------------------------------------
-- Grants. Run 09-admin-user.sql after this file to create the super admin.
-- ---------------------------------------------------------------------------

revoke all on function public.sh_base32_decode(text) from public, anon, authenticated;
revoke all on function public.sh_hotp(bytea, bigint) from public, anon, authenticated;
revoke all on function public.sh_totp_match(text, text) from public, anon, authenticated;
revoke all on function public.sh_random_base32(int) from public, anon, authenticated;
revoke all on function public.sh_admin_check_code(text) from public, anon, authenticated;

grant execute on function public.sh_track_view(text) to anon, authenticated;
grant execute on function public.sh_touch_member() to authenticated;
grant execute on function public.sh_public_brand() to anon, authenticated;

grant execute on function public.sh_admin_status() to authenticated;
grant execute on function public.sh_admin_lock() to authenticated;
grant execute on function public.sh_admin_enroll_totp() to authenticated;
grant execute on function public.sh_admin_confirm_totp(text) to authenticated;
grant execute on function public.sh_admin_verify_totp(text) to authenticated;
grant execute on function public.sh_admin_analytics(date, date) to authenticated;
grant execute on function public.sh_admin_queue(text, text) to authenticated;
grant execute on function public.sh_admin_act(bigint, text, text) to authenticated;
grant execute on function public.sh_admin_lookup_code(text) to authenticated;
grant execute on function public.sh_admin_use_code(text, numeric, text) to authenticated;
grant execute on function public.sh_admin_patients(text) to authenticated;
grant execute on function public.sh_admin_patient(uuid) to authenticated;
grant execute on function public.sh_admin_roles() to authenticated;
grant execute on function public.sh_admin_create_role(text) to authenticated;
grant execute on function public.sh_admin_set_permission(bigint, text, boolean) to authenticated;
grant execute on function public.sh_admin_invite(text, bigint) to authenticated;
grant execute on function public.sh_admin_set_staff(uuid, boolean) to authenticated;
grant execute on function public.sh_admin_reset_totp(uuid) to authenticated;
grant execute on function public.sh_admin_audit_list() to authenticated;
grant execute on function public.sh_admin_set_logo(text) to authenticated;

grant execute on function public.sh_request_withdraw(numeric, text) to authenticated;
grant execute on function public.sh_buy_product(text, text, numeric) to authenticated;
grant execute on function public.sh_buy_card(text) to authenticated;
grant execute on function public.sh_book_visit(text, int, timestamptz, text, numeric) to authenticated;
