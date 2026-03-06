-- Migration: add RLS policies for user_best_wpm to allow authenticated clients to upsert their own rows
BEGIN;

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE IF EXISTS public.user_best_wpm ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'allow_select_user_best_wpm') THEN
    EXECUTE 'DROP POLICY allow_select_user_best_wpm ON public.user_best_wpm';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'allow_upsert_own_user_best_wpm') THEN
    EXECUTE 'DROP POLICY allow_upsert_own_user_best_wpm ON public.user_best_wpm';
  END IF;
END;
$$;

-- Allow anyone to SELECT
CREATE POLICY allow_select_user_best_wpm ON public.user_best_wpm
  FOR SELECT USING (true);

-- Allow authenticated users to INSERT rows for themselves
CREATE POLICY allow_upsert_own_user_best_wpm ON public.user_best_wpm
  FOR INSERT WITH CHECK (auth.role() IS NOT NULL AND auth.uid() = user_id::text);

-- Allow authenticated users to UPDATE their own row
CREATE POLICY allow_update_own_user_best_wpm ON public.user_best_wpm
  FOR UPDATE USING (auth.role() IS NOT NULL AND auth.uid() = user_id::text)
  WITH CHECK (auth.role() IS NOT NULL AND auth.uid() = user_id::text);

COMMIT;
