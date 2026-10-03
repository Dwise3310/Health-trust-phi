-- Sure Health · part 1 of 4
-- Run this FIRST. It clears old tables that caused the "column id does not exist" error.
-- Safe to run even if some tables are missing.

drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.sh_account_number() cascade;
drop function if exists public.sh_referral_code() cascade;
drop function if exists public.ht_account_number() cascade;
drop function if exists public.ht_referral_code() cascade;

drop table if exists public.audit_log cascade;
drop table if exists public.staff_invites cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.deletion_requests cascade;
drop table if exists public.enquiries cascade;
drop table if exists public.user_missions cascade;
drop table if exists public.referrals cascade;
drop table if exists public.appointment_cards cascade;
drop table if exists public.appointments cascade;
drop table if exists public.wallet_tx cascade;
drop table if exists public.care_codes cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.profiles cascade;
