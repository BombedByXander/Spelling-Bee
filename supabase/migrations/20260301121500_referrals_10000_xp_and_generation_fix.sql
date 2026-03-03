-- Referral reward increase and reliability hardening.

alter table public.referral_redemptions
  alter column reward set default 10000;

create or replace function public.ensure_profile_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.referral_code is null or trim(new.referral_code) = '' then
    new.referral_code := public.generate_referral_code();
  else
    new.referral_code := upper(trim(new.referral_code));
  end if;
  return new;
end;
$$;

create or replace function public.get_or_create_my_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text;
  v_attempts integer := 0;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select upper(trim(referral_code)) into v_code
  from public.profiles
  where id = v_user_id
  limit 1;

  if v_code is not null and v_code <> '' then
    return v_code;
  end if;

  while v_attempts < 10 loop
    v_attempts := v_attempts + 1;
    v_code := public.generate_referral_code();

    begin
      update public.profiles
      set referral_code = v_code
      where id = v_user_id
        and (referral_code is null or trim(referral_code) = '');
    exception
      when unique_violation then
        continue;
    end;

    select upper(trim(referral_code)) into v_code
    from public.profiles
    where id = v_user_id
    limit 1;

    if v_code is not null and v_code <> '' then
      return v_code;
    end if;
  end loop;

  raise exception 'Unable to generate referral code';
end;
$$;

create or replace function public.set_my_custom_referral_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := upper(trim(coalesce(p_code, '')));
  v_level integer;
begin
  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if v_code = '' then
    return json_build_object('ok', false, 'error', 'Code required');
  end if;

  if v_code !~ '^[A-Z0-9_]{4,20}$' then
    return json_build_object('ok', false, 'error', 'Code must be 4-20 chars using A-Z, 0-9, or _');
  end if;

  select public.level_from_stars(stars) into v_level
  from public.profiles
  where id = v_user_id;

  if coalesce(v_level, 1) <= 50 then
    return json_build_object('ok', false, 'error', 'Level above 50 required for custom referral codes');
  end if;

  if exists (
    select 1
    from public.profiles
    where id <> v_user_id
      and upper(referral_code) = v_code
  ) then
    return json_build_object('ok', false, 'error', 'Code already taken');
  end if;

  update public.profiles
  set referral_code = v_code
  where id = v_user_id;

  return json_build_object('ok', true, 'code', v_code);
end;
$$;

create or replace function public.redeem_referral_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_referrer_id uuid;
  v_reward integer := 10000;
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if v_code = '' then
    return json_build_object('ok', false, 'error', 'Code required');
  end if;

  select id into v_referrer_id
  from public.profiles
  where upper(referral_code) = v_code
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
  values (v_referrer_id, v_user_id, v_code, v_reward);

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

grant execute on function public.get_or_create_my_referral_code() to authenticated;
grant execute on function public.set_my_custom_referral_code(text) to authenticated;
grant execute on function public.redeem_referral_code(text) to authenticated;