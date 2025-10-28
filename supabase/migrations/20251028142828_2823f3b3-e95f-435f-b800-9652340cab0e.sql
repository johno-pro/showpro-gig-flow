-- Drop the security definer view that's causing issues
DROP VIEW IF EXISTS public.artists_public;

-- Revoke any broad grants on artists table
REVOKE ALL ON public.artists FROM authenticated;

-- Ensure RLS is enabled on artists table
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view artists" ON public.artists;

-- Ensure admins can manage all artist data (should already exist but recreating to be safe)
DROP POLICY IF EXISTS "Admins can manage artists" ON public.artists;
CREATE POLICY "Admins can manage artists"
ON public.artists
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure managers can view artist data including contact info
DROP POLICY IF EXISTS "Managers can view artists" ON public.artists;
CREATE POLICY "Managers can view artists"
ON public.artists
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));