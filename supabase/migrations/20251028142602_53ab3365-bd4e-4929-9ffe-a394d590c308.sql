-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view artists" ON public.artists;

-- Create policy for managers to view all artists
CREATE POLICY "Managers can view artists"
ON public.artists
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Create a view for regular users that excludes sensitive contact info
CREATE OR REPLACE VIEW public.artists_public AS
SELECT 
  id,
  supplier_id,
  name,
  act_type,
  notes,
  created_at,
  updated_at
FROM public.artists;

-- Grant SELECT on the public view to authenticated users
GRANT SELECT ON public.artists_public TO authenticated;

-- Create a security definer function to get artists with bookings (for regular users)
CREATE OR REPLACE FUNCTION public.get_artists_for_bookings()
RETURNS TABLE (
  id uuid,
  name text,
  act_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, act_type
  FROM public.artists;
$$;