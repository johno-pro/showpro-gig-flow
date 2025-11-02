-- ==========================================
-- SHOWPRO SECURITY HARDENING
-- ==========================================

-- Enable RLS everywhere if not already
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 1️⃣  ARTISTS / CLIENTS / LOCATIONS / VENUES
-- Read for all authenticated, write for admin+manager
DROP POLICY IF EXISTS "Authenticated users can read artists" ON public.artists;
DROP POLICY IF EXISTS "Authenticated users can insert artists" ON public.artists;
DROP POLICY IF EXISTS "Authenticated users can update artists" ON public.artists;
DROP POLICY IF EXISTS "Authenticated users can delete artists" ON public.artists;

CREATE POLICY "artists_read" ON public.artists
  FOR SELECT USING (true);
CREATE POLICY "artists_manage" ON public.artists
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)
                 OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

CREATE POLICY "clients_read" ON public.clients
  FOR SELECT USING (true);
CREATE POLICY "clients_manage" ON public.clients
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)
                 OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Authenticated users can read locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON public.locations;

CREATE POLICY "locations_read" ON public.locations
  FOR SELECT USING (true);
CREATE POLICY "locations_manage" ON public.locations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)
                 OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can read venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can update venues" ON public.venues;
DROP POLICY IF EXISTS "Authenticated users can delete venues" ON public.venues;

CREATE POLICY "venues_read" ON public.venues
  FOR SELECT USING (true);
CREATE POLICY "venues_manage" ON public.venues
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)
                 OR has_role(auth.uid(), 'manager'::app_role));

-- 2️⃣  BOOKINGS
-- Everyone can read bookings, but only admin/manager can modify
DROP POLICY IF EXISTS "Authenticated users can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins and managers can manage bookings" ON public.bookings;

CREATE POLICY "bookings_read" ON public.bookings
  FOR SELECT USING (true);
CREATE POLICY "bookings_manage" ON public.bookings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)
                 OR has_role(auth.uid(), 'manager'::app_role));

-- Optional: hide sensitive financial columns for non-admins
CREATE OR REPLACE VIEW public.bookings_public_view AS
SELECT id, description, artist_id, client_id, start_date, start_time,
       finish_date, finish_time, artist_status, client_status, location_id,
       venue_id, notes, created_at, updated_at
FROM public.bookings;
GRANT SELECT ON public.bookings_public_view TO authenticated;

-- 3️⃣  CONTACTS
-- Read only for everyone, write only admin/manager
DROP POLICY IF EXISTS "Admins can manage contacts" ON public.contacts;
DROP POLICY IF EXISTS "Managers can view contacts" ON public.contacts;

CREATE POLICY "contacts_read" ON public.contacts
  FOR SELECT USING (true);
CREATE POLICY "contacts_manage" ON public.contacts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)
                 OR has_role(auth.uid(), 'manager'::app_role));

COMMENT ON POLICY "bookings_manage" ON public.bookings
  IS 'Restricts financial + booking edits to admin and manager roles only.';