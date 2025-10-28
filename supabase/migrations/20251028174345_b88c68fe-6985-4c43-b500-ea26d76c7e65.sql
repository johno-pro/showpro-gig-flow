-- Enable RLS policies for data import and access
-- These policies allow authenticated users to read and write to the tables

-- Artists table policies
CREATE POLICY "Authenticated users can read artists"
ON public.artists
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert artists"
ON public.artists
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update artists"
ON public.artists
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete artists"
ON public.artists
FOR DELETE
TO authenticated
USING (true);

-- Clients table policies
CREATE POLICY "Authenticated users can read clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (true);

-- Venues table policies
CREATE POLICY "Authenticated users can read venues"
ON public.venues
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert venues"
ON public.venues
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update venues"
ON public.venues
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete venues"
ON public.venues
FOR DELETE
TO authenticated
USING (true);