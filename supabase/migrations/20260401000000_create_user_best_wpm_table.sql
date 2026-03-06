-- Migration: create user_best_wpm table and triggers to keep it updated
BEGIN;

-- Create table to store each user's best WPM, mode and modifiers
CREATE TABLE IF NOT EXISTS public.user_best_wpm (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  best_wpm NUMERIC,
  mode TEXT,
  modifiers TEXT[] DEFAULT ARRAY[]::text[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_best_wpm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read best wpm" ON public.user_best_wpm
  FOR SELECT USING (true);

-- Create trigger functions (safe to create even if source tables are absent)
CREATE OR REPLACE FUNCTION public.handle_challenge_submission_best_wpm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  INSERT INTO public.user_best_wpm (user_id, best_wpm, mode, modifiers, updated_at)
  VALUES (NEW.user_id, NEW.wpm::numeric, NULL, ARRAY[]::text[], now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    best_wpm = GREATEST(public.user_best_wpm.best_wpm, EXCLUDED.best_wpm),
    updated_at = CASE WHEN EXCLUDED.best_wpm > public.user_best_wpm.best_wpm THEN now() ELSE public.user_best_wpm.updated_at END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_run_replay_best_wpm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wpm NUMERIC;
  v_mods TEXT[] := ARRAY[]::text[];
  v_mode TEXT := NULL;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF (NEW.summary->>'wpm') IS NULL THEN
    RETURN NEW; -- nothing to do
  END IF;

  v_wpm := (NEW.summary->>'wpm')::numeric;
  v_mode := COALESCE(NEW.mode::text, NULL);

  IF NEW.summary ? 'modifiers' THEN
    SELECT array_remove(array_agg(DISTINCT jsonb_array_elements_text(NEW.summary->'modifiers')), NULL) INTO v_mods;
  END IF;

  INSERT INTO public.user_best_wpm (user_id, best_wpm, mode, modifiers, updated_at)
  VALUES (NEW.author_id::uuid, v_wpm, v_mode, COALESCE(v_mods, ARRAY[]::text[]), now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    best_wpm = GREATEST(public.user_best_wpm.best_wpm, EXCLUDED.best_wpm),
    mode = CASE WHEN EXCLUDED.best_wpm > public.user_best_wpm.best_wpm THEN EXCLUDED.mode ELSE public.user_best_wpm.mode END,
    modifiers = CASE WHEN EXCLUDED.best_wpm > public.user_best_wpm.best_wpm THEN EXCLUDED.modifiers ELSE public.user_best_wpm.modifiers END,
    updated_at = CASE WHEN EXCLUDED.best_wpm > public.user_best_wpm.best_wpm THEN now() ELSE public.user_best_wpm.updated_at END;

  RETURN NEW;
END;
$$;

-- Conditionally create triggers only if the source tables exist
DO $$
BEGIN
  IF to_regclass('public.challenge_submissions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'challenge_submissions' AND t.tgname = 'trg_challenge_submission_best_wpm'
    ) THEN
      EXECUTE 'CREATE TRIGGER trg_challenge_submission_best_wpm
        AFTER INSERT OR UPDATE ON public.challenge_submissions
        FOR EACH ROW EXECUTE FUNCTION public.handle_challenge_submission_best_wpm();';
    END IF;
  END IF;

  IF to_regclass('public.run_replays') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE c.relname = 'run_replays' AND t.tgname = 'trg_run_replay_best_wpm'
    ) THEN
      EXECUTE 'CREATE TRIGGER trg_run_replay_best_wpm
        AFTER INSERT OR UPDATE ON public.run_replays
        FOR EACH ROW EXECUTE FUNCTION public.handle_run_replay_best_wpm();';
    END IF;
  END IF;
END;
$$;

-- Ensure realtime publication includes user_best_wpm (may error if publication doesn't exist; ignore)
-- Ensure realtime publication includes user_best_wpm (may error if publication doesn't exist; ignore)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_best_wpm;
  EXCEPTION WHEN undefined_table THEN
    -- ignore if publication does not exist in this environment
    NULL;
  END;
END;
$$;

COMMIT;
