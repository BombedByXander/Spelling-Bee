
-- Fix security definer view by using SECURITY INVOKER
DROP VIEW IF EXISTS public.weekly_leaderboard;
CREATE VIEW public.weekly_leaderboard
WITH (security_invoker = true)
AS
SELECT 
  ws.user_id,
  p.display_name,
  ws.streak_count,
  ws.week_start,
  ROW_NUMBER() OVER (ORDER BY ws.streak_count DESC, ws.submitted_at ASC) AS rank
FROM public.weekly_streaks ws
JOIN public.profiles p ON p.id = ws.user_id
WHERE ws.week_start = public.current_week_start()
ORDER BY ws.streak_count DESC, ws.submitted_at ASC
LIMIT 50;

-- Fix search_path on current_week_start
CREATE OR REPLACE FUNCTION public.current_week_start()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT date_trunc('week', now() AT TIME ZONE 'UTC')::date;
$$;
