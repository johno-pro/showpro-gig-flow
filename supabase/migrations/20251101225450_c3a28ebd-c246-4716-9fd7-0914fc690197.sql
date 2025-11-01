-- Add full_name column to artists table
ALTER TABLE public.artists
ADD COLUMN IF NOT EXISTS full_name text;