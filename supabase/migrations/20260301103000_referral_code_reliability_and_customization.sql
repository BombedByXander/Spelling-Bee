-- Referral reliability and level-gated custom referral codes.

create unique index if not exists profiles_referral_code_upper_unique_idx
  on public.profiles (upper(referral_code))
  where referral_code is not null;

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
    select exists(
      select 1
      from public.profiles
      where upper(referral_code) = v_code
    ) into v_exists;
    exit when not v_exists;
  end loop;

  return v_code;
end;
$$;

update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null or trim(referral_code) = '';

create or replace function public.level_from_stars(p_stars integer)
returns integer
language plpgsql
immutable
as $$
declare
  v_level integer := 1;
  v_spent bigint := 0;
  v_needed integer;
  v_stars bigint := greatest(coalesce(p_stars, 0), 0);
begin
  loop
    v_needed := floor(120 * power(v_level::numeric, 1.55));
    exit when v_stars < v_spent + v_needed;

    v_spent := v_spent + v_needed;
    v_level := v_level + 1;

    if v_level > 10000 then
      exit;
    end if;
  end loop;

  return v_level;
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
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select referral_code into v_code
  from public.profiles
  where id = v_user_id
  limit 1;

  if v_code is null or trim(v_code) = '' then
    v_code := public.generate_referral_code();
    update public.profiles
    set referral_code = v_code
    where id = v_user_id;
  end if;

  return upper(v_code);
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
    return json_build_object('ok', false, 'error', 'Level 51 required for custom referral codes');
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
  v_reward integer := 250;
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
