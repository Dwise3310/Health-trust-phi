-- Sure Health · 10b
-- Run AFTER 10a. Safe to run again. Does not drop members.
-- Prints, charts, order delivery, card codes, staff passwords, member status.

create extension if not exists pgcrypto;

alter table public.appointment_cards add column if not exists public_code text;
create unique index if not exists appointment_cards_public_code_idx
  on public.appointment_cards (public_code);

update public.appointment_cards
set public_code = 'SC-' || upper(substr(md5(id::text || 'sure'), 1, 6))
where public_code is null;

alter table public.desk_requests add column if not exists fulfill text;
alter table public.desk_requests add column if not exists ship_phone text;
alter table public.desk_requests add column if not exists ship_state text;
alter table public.desk_requests add column if not exists ship_address text;
alter table public.desk_requests add column if not exists ship_landmark text;
alter table public.desk_requests add column if not exists carrier text;
alter table public.desk_requests add column if not exists tracking_ref text;
alter table public.desk_requests add column if not exists member_status text;

create table if not exists public.care_code_uses (
  id bigserial primary key,
  code text not null,
  user_id uuid,
  percent numeric(5, 2) not null,
  note text,
  staff_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_email text,
  kind text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.outbound_emails (
  id bigserial primary key,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

alter table public.care_code_uses enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.notifications enable row level security;
alter table public.outbound_emails enable row level security;

drop policy if exists "own notices" on public.notifications;
create policy "own notices" on public.notifications
  for select using (auth.uid() = user_id);

insert into public.role_permissions (role_id, permission)
select r.id, 'records.write'
from public.roles r
where r.name in ('Clinician', 'Pharmacy')
on conflict (role_id, permission) do nothing;

create or replace function public.sh_notify(p_user uuid, p_email text, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  if p_user is not null then
    insert into public.notifications (user_id, title, body)
    values (p_user, left(p_title, 140), left(p_body, 800));
  end if;
  if coalesce(p_email, '') <> '' then
    insert into public.outbound_emails (to_email, subject, body, status)
    values (p_email, left(p_title, 140), left(p_body, 800), 'queued');
  end if;
end;
$fn$;

create or replace function public.sh_admin_use_code(p_code text, p_percent numeric, p_note text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  needle text := upper(trim(p_code));
  left_q numeric;
  uid uuid;
  em text;
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

  em := public.sh_admin_email();
  insert into public.care_code_uses (code, user_id, percent, note, staff_email)
  values (needle, uid, p_percent, nullif(trim(coalesce(p_note, '')), ''), em);

  perform public.sh_admin_audit('code_use', needle || ' used ' || p_percent || '%');
  return public.sh_admin_lookup_code(needle);
end;
$fn$;

create or replace function public.sh_admin_code_uses(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  needle text := upper(trim(p_code));
begin
  perform public.sh_admin_require('codes.check');
  return coalesce((
    select json_agg(json_build_object(
      'percent', u.percent,
      'note', u.note,
      'staff', u.staff_email,
      'at', u.created_at
    ) order by u.created_at)
    from public.care_code_uses u
    where upper(u.code) = needle
  ), '[]'::json);
end;
$fn$;

create or replace function public.sh_admin_add_record(p_user uuid, p_kind text, p_body text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  if not public.sh_admin_can('records.write') then
    raise exception 'Your role cannot write the chart';
  end if;
  if p_kind not in ('complaint', 'diagnosis', 'medication', 'progress', 'plan', 'next_visit') then
    raise exception 'Pick a chart section';
  end if;
  if length(trim(coalesce(p_body, ''))) < 2 then
    raise exception 'Write the note first';
  end if;
  insert into public.clinical_notes (user_id, author_email, kind, body)
  values (p_user, public.sh_admin_email(), p_kind, left(trim(p_body), 2000));
  perform public.sh_admin_audit('chart', p_kind || ' for ' || p_user::text);
end;
$fn$;

create or replace function public.sh_admin_records(p_user uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  perform public.sh_admin_require('patients.view');
  return coalesce((
    select json_agg(json_build_object(
      'id', n.id,
      'kind', n.kind,
      'body', n.body,
      'author', n.author_email,
      'at', n.created_at
    ) order by n.created_at desc)
    from public.clinical_notes n
    where n.user_id = p_user
  ), '[]'::json);
end;
$fn$;

create or replace function public.sh_place_order(
  p_name text,
  p_sku text,
  p_amount numeric,
  p_method text,
  p_phone text,
  p_state text,
  p_address text,
  p_landmark text,
  p_note text
)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  bal numeric;
  next_bal numeric;
  tx_id bigint;
  method text := case when p_method = 'delivery' then 'delivery' else 'pickup' end;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid amount';
  end if;
  if method = 'delivery' and length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'Delivery needs a street address';
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
    coalesce(p_name, 'Pharmacy item') || ' · ' || method || ' · ' || p_amount || ' Health · ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  )
  returning id into tx_id;

  insert into public.desk_requests (
    kind, ref_id, user_id, title, detail, amount, status,
    fulfill, ship_phone, ship_state, ship_address, ship_landmark, member_status
  )
  values (
    'pharmacy',
    'tx-' || tx_id,
    auth.uid(),
    coalesce(p_name, 'Pharmacy item'),
    'SKU ' || coalesce(p_sku, '-') || ' · ' || method || coalesce(' · ' || nullif(p_note, ''), ''),
    p_amount,
    'open',
    method,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_state, '')), ''),
    nullif(trim(coalesce(p_address, '')), ''),
    nullif(trim(coalesce(p_landmark, '')), ''),
    'paid'
  );

  return next_bal;
end;
$fn$;

create or replace function public.sh_buy_card(p_type text)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  cost numeric;
  next_bal numeric;
  card_id bigint;
  issued text;
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

  loop
    issued := 'SC-' || upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 6));
    exit when not exists (select 1 from public.appointment_cards c where c.public_code = issued);
  end loop;

  update public.wallets
    set health_balance = health_balance - cost
    where user_id = auth.uid()
    returning health_balance into next_bal;

  insert into public.appointment_cards (user_id, card_type, health_cost, status, public_code)
  values (auth.uid(), p_type, cost, 'active', issued)
  returning id into card_id;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    -cost,
    'card',
    initcap(p_type) || ' card ' || issued || ' · ' || cost || ' Health · ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  );

  insert into public.desk_requests (kind, ref_id, user_id, title, detail, amount, status, member_status)
  values (
    'card',
    'card-' || card_id,
    auth.uid(),
    initcap(p_type) || ' appointment card',
    issued || ' · ' || cost || ' Health',
    cost,
    'open',
    'active'
  );

  return next_bal;
end;
$fn$;

create or replace function public.sh_admin_lookup_card(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  result json;
  needle text := upper(trim(p_code));
begin
  perform public.sh_admin_require('cards.manage');
  select json_build_object(
    'code', c.public_code,
    'type', c.card_type,
    'cost', c.health_cost,
    'status', c.status,
    'issued_at', c.created_at,
    'member', coalesce(pr.full_name, 'Member'),
    'email', coalesce(au.email, ''),
    'phone', coalesce(pr.phone, ''),
    'tier', coalesce(sub.tier, 'none')
  ) into result
  from public.appointment_cards c
  join public.profiles pr on pr.id = c.user_id
  left join auth.users au on au.id = c.user_id
  left join lateral (
    select s.tier from public.subscriptions s
    where s.user_id = c.user_id and s.active
    order by s.started_at desc
    limit 1
  ) sub on true
  where upper(c.public_code) = needle;

  if result is null then
    raise exception 'No appointment card matches that code';
  end if;
  return result;
end;
$fn$;

create or replace function public.sh_admin_fulfill(
  p_id bigint,
  p_status text,
  p_carrier text,
  p_tracking text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  row public.desk_requests%rowtype;
  em text;
  title text;
  body text;
begin
  perform public.sh_admin_require('pharmacy.manage');
  select * into row from public.desk_requests where id = p_id and kind = 'pharmacy';
  if row.id is null then
    raise exception 'Order not found';
  end if;
  if p_status not in ('paid', 'preparing', 'ready', 'dispatched', 'delivered') then
    raise exception 'Unknown delivery step';
  end if;

  update public.desk_requests
    set member_status = p_status,
        carrier = nullif(trim(coalesce(p_carrier, '')), ''),
        tracking_ref = nullif(trim(coalesce(p_tracking, '')), ''),
        status = case when p_status = 'delivered' then 'done' else 'open' end,
        handled_by = auth.uid(),
        handled_at = now()
    where id = p_id;

  title := case p_status
    when 'preparing' then 'Pharmacy is preparing your order'
    when 'ready' then 'Your order is ready for pickup'
    when 'dispatched' then 'Your order is on the way'
    when 'delivered' then case when row.fulfill = 'pickup' then 'Your order was collected' else 'Your order was delivered' end
    else 'Pharmacy updated your order'
  end;
  body := row.title || case
    when coalesce(p_tracking, '') = '' then ''
    else '. ' || coalesce(p_carrier, 'Courier') || ' waybill ' || p_tracking
  end;
  select email into em from auth.users where id = row.user_id;
  perform public.sh_notify(row.user_id, em, title, body);
  perform public.sh_admin_audit('fulfill', row.title || ' ' || p_status);
end;
$fn$;

create or replace function public.sh_my_board()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  uid uuid := auth.uid();
  em text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  select email into em from auth.users where id = uid;
  return json_build_object(
    'withdrawals', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'amount', d.amount, 'status', d.status, 'detail', d.detail, 'at', d.created_at
      ) order by d.created_at desc)
      from public.desk_requests d
      where d.user_id = uid and d.kind = 'withdraw'
    ), '[]'::json),
    'orders', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'title', d.title, 'amount', d.amount,
        'fulfill', d.fulfill, 'status', coalesce(d.member_status, d.status),
        'carrier', d.carrier, 'tracking', d.tracking_ref,
        'address', d.ship_address, 'at', d.created_at
      ) order by d.created_at desc)
      from public.desk_requests d
      where d.user_id = uid and d.kind = 'pharmacy'
    ), '[]'::json),
    'cards', coalesce((
      select json_agg(json_build_object(
        'id', c.id, 'code', c.public_code, 'type', c.card_type,
        'cost', c.health_cost, 'status', c.status, 'at', c.created_at
      ) order by c.created_at desc)
      from public.appointment_cards c
      where c.user_id = uid
    ), '[]'::json),
    'enquiries', coalesce((
      select json_agg(json_build_object(
        'id', d.id, 'title', d.title, 'detail', d.detail,
        'status', d.status, 'reply', d.reply, 'at', d.created_at
      ) order by d.created_at desc)
      from public.desk_requests d
      where d.kind = 'enquiry'
        and (d.user_id = uid or lower(d.detail) like lower(em) || '%')
    ), '[]'::json),
    'notices', coalesce((
      select json_agg(json_build_object(
        'id', n.id, 'title', n.title, 'body', n.body, 'at', n.created_at
      ) order by n.created_at desc)
      from public.notifications n
      where n.user_id = uid
    ), '[]'::json)
  );
end;
$fn$;

create or replace function public.sh_admin_provision(p_email text, p_password text, p_role_id bigint)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  em text := lower(trim(p_email));
  uid uuid;
  pw text := trim(coalesce(p_password, ''));
begin
  if not public.sh_admin_is_super() or not public.sh_admin_verified() then
    raise exception 'Only the super admin can set a staff password';
  end if;
  if em is null or position('@' in em) = 0 then
    raise exception 'Enter a real email';
  end if;
  if not exists (select 1 from public.roles where id = p_role_id) then
    raise exception 'Pick a role';
  end if;
  if pw <> '' and length(pw) < 8 then
    raise exception 'Password needs at least 8 characters';
  end if;

  select id into uid from auth.users where lower(email) = em;
  if uid is null then
    if pw = '' then
      raise exception 'A new staff account needs a password';
    end if;
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid, 'authenticated', 'authenticated', em,
      crypt(pw, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Staff"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid::text, uid,
      jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
      'email', now(), now(), now()
    );
  elsif pw <> '' then
    update auth.users
      set encrypted_password = crypt(pw, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = uid;
  end if;

  if not exists (select 1 from public.profiles where id = uid) then
    insert into public.profiles (id, full_name, phone, referral_code, role)
    values (uid, 'Staff', '', public.sh_referral_code(), 'staff');
  end if;
  if not exists (select 1 from public.wallets where user_id = uid) then
    insert into public.wallets (user_id, account_number)
    values (uid, public.sh_account_number());
  end if;

  insert into public.staff_assignments (user_id, role_id, active)
  values (uid, p_role_id, true)
  on conflict (user_id) do update set role_id = excluded.role_id, active = true;

  delete from public.staff_invites where lower(email) = em;
  insert into public.staff_invites (email, role_id, invited_by, accepted)
  values (em, p_role_id, auth.uid(), true);

  update public.profiles set role = 'staff' where id = uid and role = 'member';
  perform public.sh_admin_audit('staff_password', em || ' role ' || p_role_id);
end;
$fn$;

create or replace function public.sh_admin_drop_staff(p_email text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  em text := lower(trim(p_email));
  uid uuid;
begin
  if not public.sh_admin_is_super() or not public.sh_admin_verified() then
    raise exception 'Only the super admin can remove staff access';
  end if;
  select id into uid from auth.users where lower(email) = em;
  if uid is not null then
    update public.staff_assignments set active = false where user_id = uid;
    update public.profiles set role = 'member' where id = uid and role = 'staff';
  end if;
  delete from public.staff_invites where lower(email) = em;
  perform public.sh_admin_audit('staff_removed', em);
end;
$fn$;

create or replace function public.sh_admin_staff_sheet(p_email text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  em text := lower(trim(p_email));
begin
  perform public.sh_admin_require('roles.manage');
  return json_build_object(
    'email', em,
    'actions', coalesce((
      select json_agg(json_build_object(
        'action', a.action, 'details', a.details, 'at', a.created_at
      ) order by a.created_at desc)
      from (
        select action, details, created_at
        from public.audit_log
        where lower(actor_username) = em
        order by created_at desc
        limit 40
      ) a
    ), '[]'::json)
  );
end;
$fn$;

-- Tell the member when the desk moves a request.
create or replace function public.sh_admin_act(p_id bigint, p_status text, p_reply text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  row public.desk_requests%rowtype;
  need text;
  em text;
  note text;
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
  if p_status not in ('open', 'confirmed', 'preparing', 'ready', 'done', 'rejected', 'replied') then
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
        member_status = p_status,
        reply = nullif(left(coalesce(p_reply, ''), 800), ''),
        handled_by = auth.uid(),
        handled_at = now()
    where id = p_id;

  if row.kind = 'visit' and row.ref_id like 'visit-%' then
    update public.appointments
      set status = p_status
      where id = substring(row.ref_id from 7)::bigint;
  end if;
  if row.kind = 'card' and p_status = 'done' and row.ref_id like 'card-%' then
    update public.appointment_cards
      set status = 'collected'
      where id = substring(row.ref_id from 6)::bigint;
  end if;

  note := case
    when row.kind = 'withdraw' and p_status = 'done' then 'Your withdrawal was paid to your bank.'
    when row.kind = 'withdraw' and p_status = 'rejected' then 'Your withdrawal was returned to your wallet.'
    when row.kind = 'visit' and p_status = 'confirmed' then 'Reception confirmed your visit.'
    when row.kind = 'visit' and p_status = 'done' then 'Your visit is marked done.'
    when row.kind = 'enquiry' and p_status = 'replied' then coalesce(nullif(p_reply, ''), 'The hospital replied to your enquiry.')
    when row.kind = 'card' and p_status = 'done' then 'Reception collected your appointment card.'
    else null
  end;
  if note is not null and row.user_id is not null then
    select email into em from auth.users where id = row.user_id;
    perform public.sh_notify(row.user_id, em, initcap(row.kind) || ' update', note);
  end if;

  perform public.sh_admin_audit(
    'desk_' || row.kind,
    row.kind || ' #' || p_id || ' set to ' || p_status
  );
end;
$fn$;

create or replace function public.sh_admin_queue(p_kind text, p_status text default 'open')
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
        d.fulfill,
        d.member_status,
        d.carrier,
        d.tracking_ref,
        d.ship_phone,
        d.ship_state,
        d.ship_address,
        d.ship_landmark,
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
          or (p_status = 'open' and d.status in ('open', 'confirmed', 'preparing', 'ready'))
          or (p_status = 'done' and d.status in ('done', 'rejected', 'replied', 'delivered'))
          or d.status = p_status
        )
    ) q
  ), '[]'::json);
end;
$fn$;

revoke all on function public.sh_notify(uuid, text, text, text) from public, anon, authenticated;

grant execute on function public.sh_admin_use_code(text, numeric, text) to authenticated;
grant execute on function public.sh_admin_code_uses(text) to authenticated;
grant execute on function public.sh_admin_add_record(uuid, text, text) to authenticated;
grant execute on function public.sh_admin_records(uuid) to authenticated;
grant execute on function public.sh_place_order(text, text, numeric, text, text, text, text, text, text) to authenticated;
grant execute on function public.sh_buy_card(text) to authenticated;
grant execute on function public.sh_admin_lookup_card(text) to authenticated;
grant execute on function public.sh_admin_fulfill(bigint, text, text, text) to authenticated;
grant execute on function public.sh_my_board() to authenticated;
grant execute on function public.sh_admin_provision(text, text, bigint) to authenticated;
grant execute on function public.sh_admin_drop_staff(text) to authenticated;
grant execute on function public.sh_admin_staff_sheet(text) to authenticated;
grant execute on function public.sh_admin_queue(text, text) to authenticated;
grant execute on function public.sh_admin_act(bigint, text, text) to authenticated;
grant select on public.notifications to authenticated;
