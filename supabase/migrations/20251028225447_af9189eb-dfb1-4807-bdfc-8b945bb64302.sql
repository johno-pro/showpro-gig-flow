-- Add map_link_url column to locations table
ALTER TABLE public.locations
ADD COLUMN map_link_url text;