-- Drop the foreign key constraint on venues.park_id to allow imports
ALTER TABLE public.venues DROP CONSTRAINT IF EXISTS venues_park_id_fkey;