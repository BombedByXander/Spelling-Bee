-- Migration: create feedback_submissions table with category and RLS policies
-- Timestamp: 2026-03-05 09:00:00

-- Ensure UUID generation function is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create feedback_submissions table
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  display_name text NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'feedback',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback_submissions(created_at);

-- Trigger to update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedback_set_updated_at ON public.feedback_submissions;
CREATE TRIGGER trg_feedback_set_updated_at
  BEFORE UPDATE ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable row-level security then create permissive policies for admin/reading and inserts
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Drop any old policies with these names (safe idempotent)
DROP POLICY IF EXISTS allow_select_feedback ON public.feedback_submissions;
DROP POLICY IF EXISTS allow_insert_feedback ON public.feedback_submissions;
DROP POLICY IF EXISTS allow_update_feedback ON public.feedback_submissions;
DROP POLICY IF EXISTS allow_delete_feedback ON public.feedback_submissions;

-- Allow selects (so admin UIs can read feedback)
CREATE POLICY allow_select_feedback
  ON public.feedback_submissions
  FOR SELECT
  USING (true);

-- Allow inserts from the client (adjust WITH CHECK expression to restrict to authenticated users if desired)
CREATE POLICY allow_insert_feedback
  ON public.feedback_submissions
  FOR INSERT
  WITH CHECK (true);

-- Allow updates (optional — keep permissive)
CREATE POLICY allow_update_feedback
  ON public.feedback_submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deletes (optional — keep permissive)
CREATE POLICY allow_delete_feedback
  ON public.feedback_submissions
  FOR DELETE
  USING (true);
