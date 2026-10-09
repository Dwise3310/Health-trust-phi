-- Sure Health · part 9
-- Run AFTER 08-admin.sql.
-- Creates the super admin in the database. The password is not in the app.
--   email    divineemmanuel461@gmail.com
--   password 01862250
-- Change the password from the staff desk after the first sign-in.
-- If this email already has a member account, this resets that password
-- and puts the account on the staff allow list.

set search_path = public, extensions;

do $$
declare
  em text := 'divineemmanuel461@gmail.com';
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(em);

  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      em,
      crypt('01862250', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Sure Health Super Admin"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      uid::text,
      uid,
      jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  else
    update auth.users
      set encrypted_password = crypt('01862250', gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"provider":"email","providers":["email"]}'::jsonb
      where id = uid;

    if not exists (
      select 1 from auth.identities where user_id = uid and provider = 'email'
    ) then
      insert into auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        uid::text,
        uid,
        jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true),
        'email',
        now(), now(), now()
      );
    end if;
  end if;

  insert into public.admin_allowlist (email, is_super, active, note)
  values (lower(em), true, true, 'Bootstrap super admin')
  on conflict (email) do update
    set is_super = true, active = true;

  update public.profiles
    set role = 'super_admin',
        full_name = coalesce(nullif(full_name, ''), 'Sure Health Super Admin')
    where id = uid;
end $$;
