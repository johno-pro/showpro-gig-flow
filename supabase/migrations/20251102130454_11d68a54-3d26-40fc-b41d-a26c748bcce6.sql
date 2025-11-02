-- Fix Security Definer Views - Convert to Security Invoker
-- This ensures views respect RLS policies of the querying user

-- Drop and recreate bookings_public_view with SECURITY INVOKER
DROP VIEW IF EXISTS public.bookings_public_view;
CREATE VIEW public.bookings_public_view
WITH (security_invoker=true) AS
SELECT 
  id,
  artist_id,
  client_id,
  start_date,
  start_time,
  finish_date,
  finish_time,
  artist_status,
  client_status,
  location_id,
  venue_id,
  notes,
  description,
  created_at,
  updated_at
FROM public.bookings;

-- Drop and recreate artists_for_bookings with SECURITY INVOKER
DROP VIEW IF EXISTS public.artists_for_bookings;
CREATE VIEW public.artists_for_bookings
WITH (security_invoker=true) AS
SELECT 
  id,
  name,
  act_type
FROM public.artists;

-- Drop and recreate contacts_basic with SECURITY INVOKER
DROP VIEW IF EXISTS public.contacts_basic;
CREATE VIEW public.contacts_basic
WITH (security_invoker=true) AS
SELECT 
  id,
  name,
  title,
  client_id,
  supplier_id,
  department_id,
  location_id AS park_id,
  created_at,
  updated_at
FROM public.contacts;

-- Drop and recreate locations_basic with SECURITY INVOKER
DROP VIEW IF EXISTS public.locations_basic;
CREATE VIEW public.locations_basic
WITH (security_invoker=true) AS
SELECT 
  id,
  name,
  address,
  postcode,
  client_id,
  created_at,
  updated_at
FROM public.locations;

-- Drop and recreate suppliers_basic with SECURITY INVOKER
DROP VIEW IF EXISTS public.suppliers_basic;
CREATE VIEW public.suppliers_basic
WITH (security_invoker=true) AS
SELECT 
  id,
  name,
  address,
  created_at,
  updated_at
FROM public.suppliers;