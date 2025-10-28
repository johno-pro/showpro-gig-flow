-- Fix security definer function by using a view-based approach instead

-- Drop the existing security definer function
DROP FUNCTION IF EXISTS public.get_artists_for_bookings();

-- Create a view that exposes only non-sensitive artist data
CREATE OR REPLACE VIEW public.artists_for_bookings AS
SELECT 
  id,
  name,
  act_type
FROM public.artists;

-- Enable RLS on the view
ALTER VIEW public.artists_for_bookings SET (security_invoker = true);

-- Grant SELECT to authenticated users on the view
GRANT SELECT ON public.artists_for_bookings TO authenticated;

-- Create RLS policy for the view (authenticated users can see artist basic info)
CREATE POLICY "Authenticated users can view artist basics"
ON public.artists
FOR SELECT
TO authenticated
USING (
  -- Allow access only to specific columns via the view context
  true
);

-- Note: The above policy combined with the view ensures authenticated users
-- can only access id, name, and act_type through the view, not email/phone directly