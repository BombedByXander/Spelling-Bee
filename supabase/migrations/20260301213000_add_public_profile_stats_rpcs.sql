-- Public stats RPCs for leaderboard profile previews under RLS.

create or replace function public.get_public_profile_stats(p_user_id uuid)
returns table (
  stars integer,
  total_correct integer,
  best_streak integer,
  total_typing_seconds integer
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(p.stars, 0)::integer as stars,
    coalesce(p.total_correct, 0)::integer as total_correct,
    coalesce(p.best_streak, 0)::integer as best_streak,
    coalesce(p.total_typing_seconds, 0)::integer as total_typing_seconds
  from public.profiles p
  where p.id = p_user_id
  limit 1;
$$;

create or replace function public.get_public_weekly_history(p_user_id uuid, p_limit integer default 10)
returns table (
  week_start date,
  streak_count integer,
  correct_count integer
)
language sql
security definer
set search_path = public
as $$
  select
    w.week_start,
    coalesce(w.streak_count, 0)::integer as streak_count,
    coalesce(w.correct_count, 0)::integer as correct_count
  from public.weekly_streaks w
  where w.user_id = p_user_id
  order by w.week_start desc
  limit greatest(1, least(coalesce(p_limit, 10), 20));
$$;

grant execute on function public.get_public_profile_stats(uuid) to anon, authenticated;
grant execute on function public.get_public_weekly_history(uuid, integer) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
