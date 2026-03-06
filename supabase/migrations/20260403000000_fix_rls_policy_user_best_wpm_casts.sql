-- Migration: fix RLS policy type mismatch for user_best_wpm (cast auth.uid() and user_id to text)
BEGIN;

-- Drop the possibly-broken policies
DROP POLICY IF EXISTS allow_select_user_best_wpm ON public.user_best_wpm;
DROP POLICY IF EXISTS allow_upsert_own_user_best_wpm ON public.user_best_wpm;
DROP POLICY IF EXISTS allow_update_own_user_best_wpm ON public.user_best_wpm;

-- Recreate safe policies with explicit casts to avoid uuid/text mismatches
CREATE POLICY allow_select_user_best_wpm ON public.user_best_wpm
  FOR SELECT USING (true);

CREATE POLICY allow_upsert_own_user_best_wpm ON public.user_best_wpm
  FOR INSERT WITH CHECK (
    auth.role() IS NOT NULL
    AND (auth.uid()::text) = (user_id::text)
  );

CREATE POLICY allow_update_own_user_best_wpm ON public.user_best_wpm
  FOR UPDATE USING (
    auth.role() IS NOT NULL
    AND (auth.uid()::text) = (user_id::text)
  ) WITH CHECK (
    auth.role() IS NOT NULL
    AND (auth.uid()::text) = (user_id::text)
  );

COMMIT;
