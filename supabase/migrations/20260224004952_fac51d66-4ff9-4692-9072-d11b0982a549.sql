
-- Add avatar_url and stars to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stars integer NOT NULL DEFAULT 0;

-- Create table for tracking total correct words (all-time)
-- and best streak (all-time)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_correct integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS best_streak integer NOT NULL DEFAULT 0;

-- Create sound purchases table
CREATE TABLE public.sound_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sound_id text NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, sound_id)
);

ALTER TABLE public.sound_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases" ON public.sound_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.sound_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Active sound preference
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_sound text NOT NULL DEFAULT 'default';

-- Add weekly_correct_count to weekly_streaks
ALTER TABLE public.weekly_streaks ADD COLUMN IF NOT EXISTS correct_count integer NOT NULL DEFAULT 0;

-- Update submit_streak to also track correct count and stars
CREATE OR REPLACE FUNCTION public.submit_streak(p_streak_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  INSERT INTO weekly_streaks (user_id, streak_count, week_start, correct_count)
  VALUES (v_user_id, p_streak_count, v_week, p_streak_count)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET 
    streak_count = GREATEST(weekly_streaks.streak_count, EXCLUDED.streak_count),
    correct_count = weekly_streaks.correct_count + EXCLUDED.correct_count,
    submitted_at = now();

  -- Update all-time stats
  UPDATE profiles 
  SET 
    total_correct = total_correct + p_streak_count,
    best_streak = GREATEST(best_streak, p_streak_count)
  WHERE id = v_user_id;
END;
$function$;

-- Function to add stars
CREATE OR REPLACE FUNCTION public.add_stars(p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE profiles SET stars = stars + p_amount WHERE id = auth.uid();
END;
$function$;

-- Function to purchase a sound
CREATE OR REPLACE FUNCTION public.purchase_sound(p_sound_id text, p_cost integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_stars integer;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT stars INTO v_stars FROM profiles WHERE id = v_user_id;
  IF v_stars < p_cost THEN RETURN false; END IF;

  INSERT INTO sound_purchases (user_id, sound_id) VALUES (v_user_id, p_sound_id)
  ON CONFLICT DO NOTHING;

  UPDATE profiles SET stars = stars - p_cost WHERE id = v_user_id;
  RETURN true;
END;
$function$;

-- Update the weekly leaderboard view to include correct_count and avatar
DROP VIEW IF EXISTS public.weekly_leaderboard;
CREATE VIEW public.weekly_leaderboard
WITH (security_invoker = true)
AS SELECT 
  ws.user_id,
  p.display_name,
  p.avatar_url,
  ws.streak_count,
  ws.correct_count,
  ws.week_start,
  ROW_NUMBER() OVER (ORDER BY ws.correct_count DESC, ws.streak_count DESC, ws.submitted_at ASC) AS rank
FROM public.weekly_streaks ws
JOIN public.profiles p ON p.id = ws.user_id
WHERE ws.week_start = public.current_week_start()
LIMIT 50;

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
