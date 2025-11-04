-- Fix PUBLIC_DATA_EXPOSURE: Restrict read access to business data based on roles

-- Step 1: Add user_id to artists table to link auth users to artist profiles
ALTER TABLE public.artists 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_artists_user_id ON public.artists(user_id);

-- Step 2: Update RLS policies to restrict read access

-- Artists: Only admins/managers or the artist themselves can view
DROP POLICY IF EXISTS "artists_read" ON public.artists;
CREATE POLICY "artists_read" ON public.artists
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  user_id = auth.uid()
);

-- Clients: Only admins/managers can view
DROP POLICY IF EXISTS "clients_read" ON public.clients;
CREATE POLICY "clients_read" ON public.clients
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Bookings: Admins/managers or artists viewing their own bookings
DROP POLICY IF EXISTS "bookings_read" ON public.bookings;
CREATE POLICY "bookings_read" ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid())
);

-- Venues: Only admins/managers can view
DROP POLICY IF EXISTS "venues_read" ON public.venues;
CREATE POLICY "venues_read" ON public.venues
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Locations: Only admins/managers can view
DROP POLICY IF EXISTS "locations_read" ON public.locations;
CREATE POLICY "locations_read" ON public.locations
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Contacts: Only admins/managers can view
DROP POLICY IF EXISTS "contacts_read" ON public.contacts;
CREATE POLICY "contacts_read" ON public.contacts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Suppliers: Already restricted to admin/manager - verify it's correct
DROP POLICY IF EXISTS "Managers can view suppliers" ON public.suppliers;
CREATE POLICY "suppliers_read" ON public.suppliers
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Payments: Already restricted to authenticated - restrict to admin only
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
CREATE POLICY "payments_read" ON public.payments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Invoice Batches: Already restricted to authenticated - restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can view invoice batches" ON public.invoice_batches;
CREATE POLICY "invoice_batches_read" ON public.invoice_batches
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Emails Queue: Already restricted to authenticated - restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can view emails queue" ON public.emails_queue;
CREATE POLICY "emails_queue_read" ON public.emails_queue
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Departments: Restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
CREATE POLICY "departments_read" ON public.departments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Teams: Restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can view teams" ON public.teams;
CREATE POLICY "teams_read" ON public.teams
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Booking Series: Already restricted properly
DROP POLICY IF EXISTS "Authenticated users can view booking series" ON public.booking_series;
CREATE POLICY "booking_series_read" ON public.booking_series
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Terms Templates: Restrict to admin/manager
DROP POLICY IF EXISTS "Authenticated users can view terms templates" ON public.terms_templates;
CREATE POLICY "terms_templates_read" ON public.terms_templates
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Invoices: Already properly restricted to managers/admins - verify
DROP POLICY IF EXISTS "Managers can view invoices" ON public.invoices;
CREATE POLICY "invoices_read" ON public.invoices
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);