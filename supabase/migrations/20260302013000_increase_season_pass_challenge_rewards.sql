-- Increase free Season Pass challenge rewards.

create or replace function public.claim_season_pass_reward(p_reward_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress public.season_pass_daily_progress%rowtype;
  v_profile public.profiles%rowtype;
  v_reward integer := 0;
  v_key text := lower(trim(coalesce(p_reward_key, '')));
begin
  if v_user_id is null then
    return false;
  end if;

  perform public.get_or_create_season_pass_daily_progress();

  select *
  into v_progress
  from public.season_pass_daily_progress
  where user_id = v_user_id
    and progress_date = current_date
  for update;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    return false;
  end if;

  if v_key = 'login' then
    if v_progress.claimed_login_reward then
      return false;
    end if;

    v_reward := 100;

    update public.season_pass_daily_progress
    set claimed_login_reward = true,
        updated_at = now()
    where user_id = v_user_id
      and progress_date = current_date;

  elsif v_key = 'stars' then
    if v_progress.claimed_stars_reward then
      return false;
    end if;

    if coalesce(v_profile.stars, 0) - coalesce(v_progress.baseline_stars, 0) < 300 then
      return false;
    end if;

    v_reward := 300;

    update public.season_pass_daily_progress
    set claimed_stars_reward = true,
        updated_at = now()
    where user_id = v_user_id
      and progress_date = current_date;

  elsif v_key = 'correct' then
    if v_progress.claimed_correct_reward then
      return false;
    end if;

    if coalesce(v_profile.total_correct, 0) - coalesce(v_progress.baseline_total_correct, 0) < 40 then
      return false;
    end if;

    v_reward := 400;

    update public.season_pass_daily_progress
    set claimed_correct_reward = true,
        updated_at = now()
    where user_id = v_user_id
      and progress_date = current_date;

  else
    return false;
  end if;

  update public.profiles
  set stars = coalesce(stars, 0) + v_reward
  where id = v_user_id;

  return true;
end;
$$;

grant execute on function public.claim_season_pass_reward(text) to authenticated;

select pg_notify('pgrst', 'reload schema');
