-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'front_desk';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'view_only';

-- Create a function to insert a profile if it doesn't exist (for adding Julie)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_full_name)
  ON CONFLICT (id) DO NOTHING;
END;
$$;