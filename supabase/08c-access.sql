-- Sure Health · 08c-access.sql
-- Run this AFTER the previous part. Does not drop members. Safe to run again.
-- Who may enter the staff desk, and 2FA setup.

-- ---------------------------------------------------------------------------
-- Who is at the desk
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_email()
returns text
language sql
stable
security definer
set search_path = public, extensions
as $fn$
  select lower(email) from auth.users where id = auth.uid();
$fn$;

create or replace function public.sh_admin_claim_invites()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_is_allowed()
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_is_super()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $fn$
  select exists (
    select 1 from public.admin_allowlist a
    where a.email = public.sh_admin_email() and a.active and a.is_super
  );
$fn$;

create or replace function public.sh_admin_verified()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $fn$
  select exists (
    select 1 from public.staff_security s
    where s.user_id = auth.uid()
      and s.totp_enabled
      and s.verified_until is not null
      and s.verified_until > now()
  );
$fn$;

create or replace function public.sh_admin_can(p_perm text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_perms()
returns text[]
language plpgsql
stable
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_require(p_perm text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_audit(p_action text, p_details text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  em text := coalesce(public.sh_admin_email(), 'staff');
begin
  insert into public.audit_log (actor_id, actor_username, action, details)
  values (auth.uid(), em, p_action, left(coalesce(p_details, ''), 500));
end;
$fn$;

create or replace function public.sh_admin_status()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_lock()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.staff_security
    set verified_until = null
    where user_id = auth.uid();
end;
$fn$;

create or replace function public.sh_admin_enroll_totp()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_check_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_confirm_totp(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_verify_totp(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

