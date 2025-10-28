-- Fix the auto-assignment trigger to use valid enum value
-- The app_role enum has: 'admin', 'manager', 'artist' (not 'user')

-- Drop function with CASCADE to remove dependent trigger
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;

-- Recreate trigger with correct role assignment (artist is the most basic role)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-assign 'artist' role to all new users (most basic role in the system)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'artist'::app_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();

-- Assign roles to existing 3 users
-- Oldest user gets admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('a322b1f6-c834-4a95-baa5-f9455fbb0df4', 'admin'::app_role);

-- Other users get manager role
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('679319cb-f8d9-4c5d-8f8c-839416b1f2dd', 'manager'::app_role),
  ('57e0304f-797a-47fe-b28e-e18a43c3e277', 'manager'::app_role);