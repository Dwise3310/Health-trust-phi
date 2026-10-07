-- Sure Health · part 7
-- RUN THIS NOW. Does not drop members.
-- Fixes: function gen_random_bytes(integer) does not exist
-- when issuing a Care Quota code.

create or replace function public.sh_issue_code(p_percent numeric)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  left_q numeric;
  code text;
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
    code := 'SH-' || upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text || n::text), 1, 6));
    exit when not exists (select 1 from public.care_codes where public.care_codes.code = code);
  end loop;

  insert into public.care_codes (user_id, code, allocated_percent, remaining_percent, status)
  values (auth.uid(), code, p_percent, p_percent, 'active');

  update public.subscriptions
    set quota_remaining = quota_remaining - p_percent
    where user_id = auth.uid() and active = true;

  insert into public.wallet_tx (user_id, amount, kind, note)
  values (
    auth.uid(),
    0,
    'care_code',
    'Issued Care Quota code ' || code || ' · allocated ' || p_percent || '% of 100% · issued ' || to_char(now(), 'DD Mon YYYY HH24:MI')
  );

  return code;
end;
$$;

grant execute on function public.sh_issue_code(numeric) to authenticated;
