-- Sure Health · part 4 of 4
-- Row security. Run AFTER 03-tables.sql succeeds.

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.care_codes enable row level security;
alter table public.wallet_tx enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_cards enable row level security;
alter table public.referrals enable row level security;
alter table public.enquiries enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.user_missions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.staff_invites enable row level security;
alter table public.audit_log enable row level security;

create policy "own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "own wallet" on public.wallets
  for select using (auth.uid() = user_id);
create policy "update own wallet" on public.wallets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own subs" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "own codes" on public.care_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tx" on public.wallet_tx
  for select using (auth.uid() = user_id);
create policy "insert own tx" on public.wallet_tx
  for insert with check (auth.uid() = user_id);

create policy "own appointments" on public.appointments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own cards" on public.appointment_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own referrals" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

create policy "insert enquiry" on public.enquiries
  for insert with check (true);

create policy "insert deletion" on public.deletion_requests
  for insert with check (true);

create policy "own missions" on public.user_missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar public read" on storage.objects;
drop policy if exists "avatar own write" on storage.objects;
drop policy if exists "avatar own update" on storage.objects;

create policy "avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar own write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar own update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
