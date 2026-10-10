-- Sure Health · 08e-queues.sql
-- Run this AFTER the previous part. Does not drop members. Safe to run again.
-- Queues, reception codes, patient folders.

-- ---------------------------------------------------------------------------
-- Queues
-- ---------------------------------------------------------------------------

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
$fn$;

create or replace function public.sh_admin_act(p_id bigint, p_status text, p_reply text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

-- ---------------------------------------------------------------------------
-- Reception: Care Quota code
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_lookup_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

-- ---------------------------------------------------------------------------
-- Patient folder
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_patients(p_query text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_patient(p_id uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

