-- Sure Health · 08h-grants.sql
-- Run this AFTER the previous part. Does not drop members. Safe to run again.
-- Permissions to call the new functions.

-- ---------------------------------------------------------------------------
-- Grants. Run 09-admin-user.sql after this file to create the super admin.
-- ---------------------------------------------------------------------------

revoke all on function public.sh_base32_decode(text) from public, anon, authenticated;
revoke all on function public.sh_hotp(bytea, bigint) from public, anon, authenticated;
revoke all on function public.sh_totp_match(text, text) from public, anon, authenticated;
revoke all on function public.sh_random_base32(int) from public, anon, authenticated;
revoke all on function public.sh_admin_check_code(text) from public, anon, authenticated;

grant execute on function public.sh_track_view(text) to anon, authenticated;
grant execute on function public.sh_touch_member() to authenticated;
grant execute on function public.sh_public_brand() to anon, authenticated;

grant execute on function public.sh_admin_status() to authenticated;
grant execute on function public.sh_admin_lock() to authenticated;
grant execute on function public.sh_admin_enroll_totp() to authenticated;
grant execute on function public.sh_admin_confirm_totp(text) to authenticated;
grant execute on function public.sh_admin_verify_totp(text) to authenticated;
grant execute on function public.sh_admin_analytics(date, date) to authenticated;
grant execute on function public.sh_admin_queue(text, text) to authenticated;
grant execute on function public.sh_admin_act(bigint, text, text) to authenticated;
grant execute on function public.sh_admin_lookup_code(text) to authenticated;
grant execute on function public.sh_admin_use_code(text, numeric, text) to authenticated;
grant execute on function public.sh_admin_patients(text) to authenticated;
grant execute on function public.sh_admin_patient(uuid) to authenticated;
grant execute on function public.sh_admin_roles() to authenticated;
grant execute on function public.sh_admin_create_role(text) to authenticated;
grant execute on function public.sh_admin_set_permission(bigint, text, boolean) to authenticated;
grant execute on function public.sh_admin_invite(text, bigint) to authenticated;
grant execute on function public.sh_admin_set_staff(uuid, boolean) to authenticated;
grant execute on function public.sh_admin_reset_totp(uuid) to authenticated;
grant execute on function public.sh_admin_audit_list() to authenticated;
grant execute on function public.sh_admin_set_logo(text) to authenticated;

grant execute on function public.sh_request_withdraw(numeric, text) to authenticated;
grant execute on function public.sh_buy_product(text, text, numeric) to authenticated;
grant execute on function public.sh_buy_card(text) to authenticated;
grant execute on function public.sh_book_visit(text, int, timestamptz, text, numeric) to authenticated;
