-- Add font system: active_font column, font_purchases table, and purchase_font RPC

-- Add active_font column to profiles
ALTER TABLE IF EXISTS profiles
ADD COLUMN active_font text DEFAULT 'default';

-- Create font_purchases table
CREATE TABLE IF NOT EXISTS font_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  font_id text NOT NULL,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(user_id, font_id)
);

-- Enable RLS for font_purchases
ALTER TABLE font_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to see only their own purchases
CREATE POLICY "Users can view their own font purchases"
ON font_purchases FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS policy to allow the purchase_font function to insert
CREATE POLICY "Users can purchase fonts"
ON font_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to purchase a font
CREATE OR REPLACE FUNCTION public.purchase_font(p_font_id text, p_cost integer)
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

  INSERT INTO font_purchases (user_id, font_id) VALUES (v_user_id, p_font_id)
  ON CONFLICT DO NOTHING;

  UPDATE profiles SET stars = stars - p_cost WHERE id = v_user_id;
  RETURN true;
END;
$function$;
