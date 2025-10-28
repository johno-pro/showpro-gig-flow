-- Rename parks table to locations
ALTER TABLE public.parks RENAME TO locations;

-- Rename foreign key columns in related tables
ALTER TABLE public.bookings RENAME COLUMN park_id TO location_id;
ALTER TABLE public.venues RENAME COLUMN park_id TO location_id;
ALTER TABLE public.contacts RENAME COLUMN park_id TO location_id;

-- Update the parks_basic view to locations_basic
DROP VIEW IF EXISTS public.parks_basic;
CREATE VIEW public.locations_basic AS
SELECT 
  id,
  name,
  address,
  postcode,
  client_id,
  created_at,
  updated_at
FROM public.locations;

-- Update RLS policies (they should automatically transfer with the table rename, but let's be explicit)
-- The policies are already in place on the renamed table