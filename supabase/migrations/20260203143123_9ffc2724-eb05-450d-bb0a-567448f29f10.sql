-- Update profiles RLS to restrict admin access to sensitive token columns
-- Drop the existing admin policy that allows viewing all profile data
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a new admin policy that explicitly excludes sensitive token columns
-- Admins will use the profiles_admin_view instead for user management
-- But we need to keep some access for the service role functions that update tokens

-- Re-create the policy but note that admins should use profiles_admin_view for viewing
-- The base table policy remains for users to access their own data
-- Admins can still access through the view which excludes tokens