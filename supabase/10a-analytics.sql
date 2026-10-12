-- Sure Health · 10a
-- Run this now. Fixes analytics: timestamp with time zone + integer.
-- Safe to run again. Does not drop members.

create or replace function public.sh_admin_analytics(p_from date, p_to date)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
      where created_at >= d0 and created_at < (d1 + interval '1 day')
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
      where created_at >= d0 and created_at < (d1 + interval '1 day')
    ),
    'unique_members', (
      select count(distinct user_id) from public.site_events
      where user_id is not null
        and created_at >= d0 and created_at < (d1 + interval '1 day')
    ),
    'revenue_health', coalesce((
      select sum(-amount) from public.wallet_tx
      where amount < 0
        and kind in ('membership', 'product', 'card', 'appointment', 'visit')
        and created_at >= d0 and created_at < (d1 + interval '1 day')
    ), 0),
    'sales_count', (
      select count(*) from public.wallet_tx
      where amount < 0
        and kind in ('membership', 'product', 'card', 'appointment', 'visit')
        and created_at >= d0 and created_at < (d1 + interval '1 day')
    ),
    'deposits_health', coalesce((
      select sum(amount) from public.wallet_tx
      where amount > 0
        and kind in ('deposit', 'test_credit')
        and created_at >= d0 and created_at < (d1 + interval '1 day')
    ), 0),
    'withdraw_health', coalesce((
      select sum(-amount) from public.wallet_tx
      where kind = 'withdraw_request'
        and created_at >= d0 and created_at < (d1 + interval '1 day')
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
          (select count(*) from public.site_events e where e.created_at >= gs::date and e.created_at < (gs::date + interval '1 day')) as views,
          (select count(*) from public.profiles p where p.created_at >= gs::date and p.created_at < (gs::date + interval '1 day')) as signups,
          coalesce((
            select sum(-amount) from public.wallet_tx t
            where t.amount < 0
              and t.kind in ('membership', 'product', 'card', 'appointment', 'visit')
              and t.created_at >= gs::date and t.created_at < (gs::date + interval '1 day')
          ), 0) as revenue,
          coalesce((
            select sum(amount) from public.wallet_tx t
            where t.amount > 0
              and t.kind in ('deposit', 'test_credit')
              and t.created_at >= gs::date and t.created_at < (gs::date + interval '1 day')
          ), 0) as deposits,
          (
            select count(*) from public.wallet_tx t
            where t.amount < 0
              and t.kind in ('membership', 'product', 'card', 'appointment', 'visit')
              and t.created_at >= gs::date and t.created_at < (gs::date + interval '1 day')
          ) as sales
        from generate_series(d0, d1, interval '1 day') as gs
      ) x
    )
  ) into result;

  return result;
end;
$fn$;


grant execute on function public.sh_admin_analytics(date, date) to authenticated;
