-- Sure Health · part 5
-- RUN THIS NOW. Do not re-run 01-reset.sql.
-- Fixes: permission denied for table X, referral stuck, test Health not adding.
-- Safe on live data.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated, anon;
grant execute on all functions in schema public to authenticated;

grant insert on table public.enquiries to anon;
grant insert on table public.deletion_requests to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;

drop policy if exists "insert own subs" on public.subscriptions;
drop policy if exists "update own subs" on public.subscriptions;
drop policy if exists "insert own referrals" on public.referrals;

create policy "insert own subs" on public.subscriptions
  for insert with check (auth.uid() = user_id);
create policy "update own subs" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "insert own referrals" on public.referrals
  for insert with check (auth.uid() = referrer_id);

create or replace function public.sh_test_credit(p_amount numeric)
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
  if p_amount is null or p_amount <= 0 or p_amount > 1000 then
    raise exception 'Invalid amount';
  end if;

  update public.wallets
    set health_balance = health_balance + p_amount
    where user_id = auth.uid()
    returning health_balance into next_bal;

  if next_bal is null then
    raise exception 'Wallet not found';
  end if;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (auth.uid(), p_amount, 'test_credit', 'Desk test credit');

  return next_bal;
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
  quota numeric;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if p_tier = 'base' then
    price := 250; months := 6; quota := 5;
  elsif p_tier = 'plus' then
    price := 500; months := 9; quota := 10;
  elsif p_tier = 'prime' then
    price := 1000; months := 12; quota := 15;
  else
    raise exception 'Unknown plan';
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
    quota,
    quota,
    now() + interval '3 months',
    true
  );

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (auth.uid(), -price, 'membership', 'Sure Health ' || p_tier);

  return json_build_object(
    'tier', p_tier,
    'paid', price,
    'balance', next_bal,
    'quota', quota
  );
end;
$$;

create or replace function public.sh_request_withdraw(p_amount numeric, p_note text)
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
  values (auth.uid(), -p_amount, 'withdraw_request', coalesce(p_note, ''));

  return next_bal;
end;
$$;

revoke all on function public.sh_test_credit(numeric) from public, anon;
revoke all on function public.sh_buy_tier(text) from public, anon;
revoke all on function public.sh_request_withdraw(numeric, text) from public, anon;

grant execute on function public.sh_test_credit(numeric) to authenticated;
grant execute on function public.sh_buy_tier(text) to authenticated;
grant execute on function public.sh_request_withdraw(numeric, text) to authenticated;
