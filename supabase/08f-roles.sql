-- Sure Health · 08f-roles.sql
-- Run this AFTER the previous part. Does not drop members. Safe to run again.
-- Roles, invites, audit, logo.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

create or replace function public.sh_admin_roles()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_create_role(p_name text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_set_permission(p_role_id bigint, p_permission text, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_invite(p_email text, p_role_id bigint)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_set_staff(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  perform public.sh_admin_require('roles.manage');
  update public.staff_assignments set active = p_active where user_id = p_user_id;
  perform public.sh_admin_audit(
    'staff_active',
    p_user_id::text || ' ' || case when p_active then 'on' else 'off' end
  );
end;
$fn$;

create or replace function public.sh_admin_reset_totp(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

create or replace function public.sh_admin_audit_list()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $fn$
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
$fn$;

-- ---------------------------------------------------------------------------
-- Logo
-- ---------------------------------------------------------------------------

create or replace function public.sh_public_brand()
returns json
language sql
stable
security definer
set search_path = public, extensions
as $fn$
  select json_build_object('logo_url', logo_url) from public.hospital_brand where id = 1;
$fn$;

create or replace function public.sh_admin_set_logo(p_url text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $fn$
begin
  perform public.sh_admin_require('branding.manage');
  update public.hospital_brand
    set logo_url = nullif(trim(p_url), ''), updated_at = now()
    where id = 1;
  perform public.sh_admin_audit('logo', coalesce(p_url, 'cleared'));
end;
$fn$;

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

