
-- Fix security definer view by using security_invoker
ALTER VIEW public.weekly_leaderboard SET (security_invoker = on);
