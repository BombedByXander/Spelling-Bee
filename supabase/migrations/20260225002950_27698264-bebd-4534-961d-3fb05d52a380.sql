
-- Create admin role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Anyone authenticated can read roles (needed for admin badge on leaderboard)
CREATE POLICY "Anyone can read roles" ON public.user_roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add username and username_changed_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;

-- Create daily_logins table for daily streak tracking
CREATE TABLE public.daily_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date date NOT NULL DEFAULT (CURRENT_DATE),
  stars_awarded integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, login_date)
);

ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logins" ON public.daily_logins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logins" ON public.daily_logins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to claim daily login stars (idempotent per day)
CREATE OR REPLACE FUNCTION public.claim_daily_login()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_already_claimed boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  SELECT EXISTS(SELECT 1 FROM daily_logins WHERE user_id = v_user_id AND login_date = CURRENT_DATE) INTO v_already_claimed;
  
  IF v_already_claimed THEN RETURN false; END IF;
  
  INSERT INTO daily_logins (user_id, login_date) VALUES (v_user_id, CURRENT_DATE);
  UPDATE profiles SET stars = stars + 100 WHERE id = v_user_id;
  
  RETURN true;
END;
$$;

-- Function to change username (limited to once per 2 months)
CREATE OR REPLACE FUNCTION public.change_username(p_new_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_last_change timestamptz;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF length(p_new_username) < 3 OR length(p_new_username) > 20 THEN RAISE EXCEPTION 'Username must be 3-20 chars'; END IF;
  
  SELECT username_changed_at INTO v_last_change FROM profiles WHERE id = v_user_id;
  
  IF v_last_change IS NOT NULL AND v_last_change > now() - interval '2 months' THEN
    RETURN false;
  END IF;
  
  UPDATE profiles SET username = p_new_username, username_changed_at = now() WHERE id = v_user_id;
  RETURN true;
END;
$$;

-- Update weekly_leaderboard view to include user_id for role lookups
DROP VIEW IF EXISTS public.weekly_leaderboard;
CREATE VIEW public.weekly_leaderboard AS
SELECT
  ws.week_start,
  ROW_NUMBER() OVER (ORDER BY ws.correct_count DESC, ws.streak_count DESC) AS rank,
  ws.streak_count,
  ws.user_id,
  p.display_name,
  p.avatar_url,
  p.username,
  ws.correct_count
FROM weekly_streaks ws
JOIN profiles p ON p.id = ws.user_id
WHERE ws.week_start = current_week_start()
ORDER BY ws.correct_count DESC, ws.streak_count DESC;

-- Update handle_new_user to also set username from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;
