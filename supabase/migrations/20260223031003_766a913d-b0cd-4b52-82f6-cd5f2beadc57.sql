
-- Profiles table (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Weekly streaks table
CREATE TABLE public.weekly_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_count INT NOT NULL CHECK (streak_count > 0),
  week_start DATE NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read streaks" ON public.weekly_streaks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own streaks" ON public.weekly_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.weekly_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Helper: get current week start (Monday 00:00 UTC)
CREATE OR REPLACE FUNCTION public.current_week_start()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('week', now() AT TIME ZONE 'UTC')::date;
$$;

-- Function to submit/update streak (upsert - only if higher)
CREATE OR REPLACE FUNCTION public.submit_streak(p_streak_count INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_week DATE := current_week_start();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_streak_count <= 0 THEN
    RAISE EXCEPTION 'Streak must be positive';
  END IF;
  
  INSERT INTO weekly_streaks (user_id, streak_count, week_start)
  VALUES (v_user_id, p_streak_count, v_week)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET streak_count = GREATEST(weekly_streaks.streak_count, EXCLUDED.streak_count),
               submitted_at = now();
END;
$$;

-- Leaderboard view: top 50 for current week
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
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

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_streaks;
