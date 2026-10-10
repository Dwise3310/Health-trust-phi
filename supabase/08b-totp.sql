-- Sure Health · 08b-totp.sql
-- Run this AFTER the previous part. Does not drop members. Safe to run again.
-- Authenticator code checks.

-- ---------------------------------------------------------------------------
-- TOTP (authenticator apps). search_path includes extensions for hmac.
-- ---------------------------------------------------------------------------

create or replace function public.sh_base32_decode(p_in text)
returns bytea
language plpgsql
immutable
set search_path = public, extensions
as $fn$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  clean text;
  buffer bigint := 0;
  bits int := 0;
  i int;
  val int;
  out bytea := ''::bytea;
begin
  clean := upper(regexp_replace(coalesce(p_in, ''), '[^A-Z2-7]', '', 'g'));
  for i in 1..length(clean) loop
    val := position(substr(clean, i, 1) in alphabet) - 1;
    if val < 0 then
      continue;
    end if;
    buffer := (buffer << 5) | val;
    bits := bits + 5;
    if bits >= 8 then
      bits := bits - 8;
      out := out || set_byte('\x00'::bytea, 0, ((buffer >> bits) & 255)::int);
    end if;
  end loop;
  return out;
end;
$fn$;

create or replace function public.sh_hotp(p_key bytea, p_counter bigint)
returns text
language plpgsql
immutable
set search_path = public, extensions
as $fn$
declare
  msg bytea;
  mac bytea;
  mac_offset int;
  bin bigint;
begin
  msg := substring(int8send(p_counter) from 1 for 8);
  mac := hmac(msg, p_key, 'sha1');
  mac_offset := get_byte(mac, 19) & 15;
  bin := ((get_byte(mac, mac_offset) & 127)::bigint << 24)
      | (get_byte(mac, mac_offset + 1)::bigint << 16)
      | (get_byte(mac, mac_offset + 2)::bigint << 8)
      | get_byte(mac, mac_offset + 3)::bigint;
  return lpad((bin % 1000000)::text, 6, '0');
end;
$fn$;

create or replace function public.sh_totp_match(p_secret text, p_code text)
returns boolean
language plpgsql
stable
set search_path = public, extensions
as $fn$
declare
  key bytea;
  counter bigint;
  step int;
  got text;
begin
  got := lpad(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), 6, '0');
  if length(got) <> 6 or p_secret is null or p_secret = '' then
    return false;
  end if;
  key := public.sh_base32_decode(p_secret);
  if key is null or octet_length(key) < 10 then
    return false;
  end if;
  counter := floor(extract(epoch from now()) / 30)::bigint;
  for step in -1..1 loop
    if public.sh_hotp(key, counter + step) = got then
      return true;
    end if;
  end loop;
  return false;
end;
$fn$;

create or replace function public.sh_random_base32(p_len int)
returns text
language plpgsql
volatile
set search_path = public, extensions
as $fn$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  out text := '';
  i int;
begin
  for i in 1..p_len loop
    out := out || substr(alphabet, 1 + floor(random() * 32)::int, 1);
  end loop;
  return out;
end;
$fn$;

