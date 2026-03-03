-- Premium membership, ad preferences, and referral rewards.

alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_until timestamptz,
  add column if not exists ad_preference text not null default 'limited',
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null;

alter table public.profiles
  drop constraint if exists profiles_ad_preference_check;

alter table public.profiles
  add constraint profiles_ad_preference_check
  check (ad_preference in ('on', 'limited', 'off'));

create unique index if not exists profiles_referral_code_unique_idx
  on public.profiles (referral_code)
  where referral_code is not null;

create table if not exists public.referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  reward integer not null default 250,
  constraint referral_redemptions_unique_referred unique (referred_id),
  constraint referral_redemptions_referrer_not_self check (referrer_id <> referred_id)
);

alter table public.referral_redemptions enable row level security;

drop policy if exists "Users can read own referral redemptions" on public.referral_redemptions;
create policy "Users can read own referral redemptions"
  on public.referral_redemptions
  for select
  to authenticated
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));
    select exists(select 1 from public.profiles where referral_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;

  return v_code;
end;
$$;

update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;

create or replace function public.ensure_profile_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.generate_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
before insert on public.profiles
for each row
execute function public.ensure_profile_referral_code();

create or replace function public.redeem_referral_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
  v_reward integer := 250;
begin
  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if trim(coalesce(p_code, '')) = '' then
    return json_build_object('ok', false, 'error', 'Code required');
  end if;

  select id into v_referrer_id
  from public.profiles
  where referral_code = upper(trim(p_code))
  limit 1;

  if v_referrer_id is null then
    return json_build_object('ok', false, 'error', 'Invalid referral code');
  end if;

  if v_referrer_id = v_user_id then
    return json_build_object('ok', false, 'error', 'Cannot redeem your own code');
  end if;

  if exists (select 1 from public.referral_redemptions where referred_id = v_user_id) then
    return json_build_object('ok', false, 'error', 'Referral already redeemed');
  end if;

  insert into public.referral_redemptions (referrer_id, referred_id, code, reward)
  values (v_referrer_id, v_user_id, upper(trim(p_code)), v_reward);

  update public.profiles
  set referred_by = v_referrer_id,
      stars = coalesce(stars, 0) + v_reward
  where id = v_user_id;

  update public.profiles
  set stars = coalesce(stars, 0) + v_reward
  where id = v_referrer_id;

  return json_build_object('ok', true, 'reward', v_reward);
exception
  when unique_violation then
    return json_build_object('ok', false, 'error', 'Referral already redeemed');
end;
$$;
