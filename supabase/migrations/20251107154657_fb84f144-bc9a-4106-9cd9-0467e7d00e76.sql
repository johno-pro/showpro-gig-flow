-- Add URL validation constraints to prevent injection attacks
-- These constraints ensure URLs must be HTTP(S) or empty/null

-- Validate confirmation_link must be HTTP(S) or empty
ALTER TABLE bookings
ADD CONSTRAINT valid_confirmation_link 
CHECK (
  confirmation_link IS NULL OR
  confirmation_link = '' OR
  confirmation_link ~* '^https?://'
);

-- Validate invoice_upload_url must be HTTP(S) or empty
ALTER TABLE artists
ADD CONSTRAINT valid_invoice_url 
CHECK (
  invoice_upload_url IS NULL OR
  invoice_upload_url = '' OR
  invoice_upload_url ~* '^https?://'
);

-- Validate map_link_url must be HTTP(S) or empty
ALTER TABLE locations
ADD CONSTRAINT valid_map_url 
CHECK (
  map_link_url IS NULL OR
  map_link_url = '' OR
  map_link_url ~* '^https?://'
);