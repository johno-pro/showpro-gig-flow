-- Drop conflicting restrictive policies that are blocking inserts
DROP POLICY IF EXISTS "Admins can manage artists" ON public.artists;
DROP POLICY IF EXISTS "Managers can view artists" ON public.artists;
DROP POLICY IF EXISTS "Authenticated users can view artist basics" ON public.artists;

DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;

DROP POLICY IF EXISTS "Admins can manage venues" ON public.venues;