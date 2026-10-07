-- Sure Health · part 6
-- RUN THIS NOW. Does not drop members.
-- Care Quota is 100% full on every plan (the 15% number is referral cashback only).
-- Upgrade only while a plan is live. Resets mission claims.

delete from public.user_missions;

update public.subscriptions s
set
  quota_percent = 100,
  quota_remaining = greatest(
    0,
    100 - coalesce((
      select sum(c.allocated_percent)
      from public.care_codes c
      where c.user_id = s.user_id and c.status = 'active'
    ), 0)
  )
where s.active = true;

drop policy if exists "referral names" on public.profiles;
drop policy if exists "referral plans" on public.subscriptions;

create policy "referral names" on public.profiles
  for select using (
    exists (
      select 1 from public.referrals r
      where r.referred_id = profiles.id and r.referrer_id = auth.uid()
    )
  );

create policy "referral plans" on public.subscriptions
  for select using (
    exists (
      select 1 from public.referrals r
      where r.referred_id = subscriptions.user_id and r.referrer_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ref text;
  referrer uuid;
begin
  ref := nullif(trim(coalesce(new.raw_user_meta_data->>'referred_by', '')), '');

  insert into public.profiles (id, full_name, phone, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    public.sh_referral_code(),
    ref
  );

  insert into public.wallets (user_id, account_number)
  values (new.id, public.sh_account_number());

  if ref is not null then
    select id into referrer from public.profiles where referral_code = upper(ref) or referral_code = ref;
    if referrer is not null then
      insert into public.referrals (referrer_id, referred_id, percent)
      values (referrer, new.id, 0)
      on conflict (referred_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.sh_buy_tier(p_tier text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  price numeric;
  months int;
  bal numeric;
  next_bal numeric;
  cur text;
  cur_exp timestamptz;
  cur_rank int;
  new_rank int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if p_tier = 'base' then
    price := 250; months := 6; new_rank := 1;
  elsif p_tier = 'plus' then
    price := 500; months := 9; new_rank := 2;
  elsif p_tier = 'prime' then
    price := 1000; months := 12; new_rank := 3;
  else
    raise exception 'Unknown plan';
  end if;

  select tier, expires_at into cur, cur_exp
  from public.subscriptions
  where user_id = auth.uid() and active = true
  order by expires_at desc
  limit 1;

  if cur is not null and (cur_exp is null or cur_exp > now()) then
    cur_rank := case cur when 'prime' then 3 when 'plus' then 2 else 1 end;
    if new_rank < cur_rank then
      raise exception 'You can only move up while a plan is active. Wait until it ends to pick a lower plan.';
    end if;
    if new_rank = cur_rank then
      raise exception 'That plan is already active.';
    end if;
  end if;

  select health_balance into bal from public.wallets where user_id = auth.uid();
  if bal is null then
    raise exception 'Wallet not found';
  end if;
  if bal < price then
    raise exception 'Not enough Health';
  end if;

  update public.wallets
    set health_balance = health_balance - price
    where user_id = auth.uid()
    returning health_balance into next_bal;

  update public.subscriptions
    set active = false
    where user_id = auth.uid() and active = true;

  insert into public.subscriptions (
    user_id, tier, expires_at, quota_percent, quota_remaining, next_refresh_at, active
  ) values (
    auth.uid(),
    p_tier,
    now() + (months || ' months')::interval,
    100,
    100,
    now() + interval '3 months',
    true
  );

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    -price,
    'membership',
    'Paid Sure Health ' || initcap(p_tier) || ' · ' || months || ' months · Care Quota filled to 100% · ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  );

  return json_build_object('tier', p_tier, 'paid', price, 'balance', next_bal, 'quota', 100);
end;
$$;

create or replace function public.sh_issue_code(p_percent numeric)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  left_q numeric;
  new_code text;
  n int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_percent is null or p_percent <= 0 or p_percent > 100 then
    raise exception 'Invalid percent';
  end if;

  select quota_remaining into left_q
  from public.subscriptions
  where user_id = auth.uid() and active = true
  limit 1;

  if left_q is null then
    raise exception 'Buy a plan first';
  end if;
  if p_percent > left_q then
    raise exception 'Not enough Care Quota remaining';
  end if;

  loop
    n := n + 1;
    new_code := 'SH-' || upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text || n::text), 1, 6));
    exit when not exists (select 1 from public.care_codes as c where c.code = new_code);
  end loop;

  insert into public.care_codes (user_id, code, allocated_percent, remaining_percent, status)
  values (auth.uid(), new_code, p_percent, p_percent, 'active');

  update public.subscriptions
    set quota_remaining = quota_remaining - p_percent
    where user_id = auth.uid() and active = true;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    0,
    'care_code',
    'Issued Care Quota code ' || new_code || ' · allocated ' || p_percent || '% of 100% · issued ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  );

  return new_code;
end;
$$;

create or replace function public.sh_cancel_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  slice numeric;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select remaining_percent into slice
  from public.care_codes
  where user_id = auth.uid() and code = p_code and status = 'active';

  if slice is null then
    raise exception 'Code not found or already cancelled';
  end if;

  update public.care_codes
    set status = 'cancelled'
    where user_id = auth.uid() and code = p_code;

  update public.subscriptions
    set quota_remaining = least(100, quota_remaining + slice)
    where user_id = auth.uid() and active = true;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    0,
    'care_code',
    'Cancelled Care Quota code ' || p_code || ' · returned ' || slice || '% to membership'
  );
end;
$$;

create or replace function public.sh_buy_product(p_name text, p_sku text, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  bal numeric;
  next_bal numeric;
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
  );

  return next_bal;
end;
$$;

create or replace function public.sh_buy_card(p_type text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  cost numeric;
  next_bal numeric;
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
  values (auth.uid(), p_type, cost, 'active');

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    -cost,
    'card',
    initcap(p_type) || ' digital appointment card · ' || cost || ' Health (₦' || (cost * 100) || ') · skip the paper queue · ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  );

  return next_bal;
end;
$$;

create or replace function public.sh_book_visit(p_kind text, p_minutes int, p_when timestamptz, p_note text, p_cost numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  next_bal numeric;
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
  values (auth.uid(), p_kind, p_minutes, p_when, p_cost, p_note, 'scheduled');

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    -p_cost,
    'appointment',
    case when p_kind = 'audio' then 'In-app audio call' else 'Physical visit' end
      || ' · ' || p_minutes || ' min · ' || to_char(p_when, 'DD Mon YYYY HH24:MI')
      || ' · ' || p_cost || ' Health'
  );

  return next_bal;
end;
$$;

create or replace function public.sh_claim_mission(p_id text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  reward numeric;
  ok boolean := false;
  next_bal numeric;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if exists (
    select 1 from public.user_missions
    where user_id = auth.uid() and mission_id = p_id
  ) then
    raise exception 'Already claimed';
  end if;

  if p_id = 'profile' then
    reward := 10;
    select
      coalesce(avatar_url, '') <> ''
      and coalesce(phone, '') <> ''
      and coalesce(state_of_origin, '') <> ''
      and coalesce(next_of_kin_name, '') <> ''
    into ok
    from public.profiles where id = auth.uid();
  elsif p_id = 'username' then
    reward := 5;
    select username_locked into ok from public.profiles where id = auth.uid();
  elsif p_id = 'deposit' then
    reward := 15;
    select exists(
      select 1 from public.wallet_tx
      where user_id = auth.uid() and amount > 0
    ) into ok;
  elsif p_id = 'product' then
    reward := 12;
    select exists(
      select 1 from public.wallet_tx
      where user_id = auth.uid() and kind = 'product'
    ) into ok;
  elsif p_id = 'card' then
    reward := 8;
    select exists(
      select 1 from public.appointment_cards where user_id = auth.uid()
    ) into ok;
  elsif p_id = 'booking' then
    reward := 10;
    select exists(
      select 1 from public.appointments where user_id = auth.uid()
    ) into ok;
  elsif p_id = 'share' then
    reward := 8;
    select exists(
      select 1 from public.care_codes where user_id = auth.uid()
    ) into ok;
  elsif p_id = 'refer' then
    reward := 5;
    select exists(
      select 1 from public.referrals where referrer_id = auth.uid()
    ) into ok;
  else
    raise exception 'Unknown mission';
  end if;

  if not coalesce(ok, false) then
    raise exception 'That mission is not finished yet';
  end if;

  insert into public.user_missions (user_id, mission_id) values (auth.uid(), p_id);

  update public.wallets
    set health_balance = health_balance + reward
    where user_id = auth.uid()
    returning health_balance into next_bal;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (auth.uid(), reward, 'mission', 'Mission reward · ' || p_id || ' · ' || reward || ' Health');

  return next_bal;
end;
$$;

grant execute on function public.sh_buy_tier(text) to authenticated;
grant execute on function public.sh_issue_code(numeric) to authenticated;
grant execute on function public.sh_cancel_code(text) to authenticated;
grant execute on function public.sh_buy_product(text, text, numeric) to authenticated;
grant execute on function public.sh_buy_card(text) to authenticated;
grant execute on function public.sh_book_visit(text, int, timestamptz, text, numeric) to authenticated;
grant execute on function public.sh_claim_mission(text) to authenticated;
