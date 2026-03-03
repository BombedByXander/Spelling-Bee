-- Free daily season pass missions and rewards.

create table if not exists public.season_pass_daily_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  progress_date date not null default current_date,
  baseline_stars integer not null default 0,
  baseline_total_correct integer not null default 0,
  claimed_login_reward boolean not null default false,
  claimed_stars_reward boolean not null default false,
  claimed_correct_reward boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, progress_date)
);

alter table public.season_pass_daily_progress enable row level security;

drop policy if exists "Users can read own season pass progress" on public.season_pass_daily_progress;
create policy "Users can read own season pass progress"
  on public.season_pass_daily_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.get_or_create_season_pass_daily_progress()
returns table (
  progress_date date,
  baseline_stars integer,
  baseline_total_correct integer,
  claimed_login_reward boolean,
  claimed_stars_reward boolean,
  claimed_correct_reward boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.season_pass_daily_progress (
    user_id,
    progress_date,
    baseline_stars,
    baseline_total_correct
  )
  select
    p.id,
    current_date,
    coalesce(p.stars, 0),
    coalesce(p.total_correct, 0)
  from public.profiles p
  where p.id = v_user_id
  on conflict (user_id, progress_date) do nothing;

  return query
  select
    s.progress_date,
    s.baseline_stars,
    s.baseline_total_correct,
    s.claimed_login_reward,
    s.claimed_stars_reward,
    s.claimed_correct_reward
  from public.season_pass_daily_progress s
  where s.user_id = v_user_id
    and s.progress_date = current_date
  limit 1;
end;
$$;

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

    v_reward := 50;

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

    v_reward := 150;

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

    v_reward := 200;

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

grant execute on function public.get_or_create_season_pass_daily_progress() to authenticated;
grant execute on function public.claim_season_pass_reward(text) to authenticated;

select pg_notify('pgrst', 'reload schema');
