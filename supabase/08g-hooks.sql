-- Sure Health · 08g-hooks.sql
-- Run this AFTER the previous part. Does not drop members. Safe to run again.
-- Orders land on the desk. Default roles.

-- ---------------------------------------------------------------------------
-- New member actions also land on the desk
-- ---------------------------------------------------------------------------

create or replace function public.sh_request_withdraw(p_amount numeric, p_note text)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_buy_product(p_name text, p_sku text, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_book_visit(p_kind text, p_minutes int, p_when timestamptz, p_note text, p_cost numeric)
returns numeric
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_enquiry_to_desk()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

drop trigger if exists enquiry_to_desk on public.enquiries;
create trigger enquiry_to_desk
  after insert on public.enquiries
  for each row execute function public.sh_enquiry_to_desk();

create or replace function public.sh_deletion_to_desk()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

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

