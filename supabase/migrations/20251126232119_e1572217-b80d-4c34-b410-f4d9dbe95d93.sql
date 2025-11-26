-- Add is_venue_operator field to clients table
ALTER TABLE public.clients 
ADD COLUMN is_venue_operator boolean DEFAULT true;

-- Add a comment for clarity
COMMENT ON COLUMN public.clients.is_venue_operator IS 'Whether this client operates venues/locations. If false, they are just a client.';