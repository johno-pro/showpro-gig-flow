
-- Move pg_trgm extension from public schema to extensions schema
-- This is a security best practice to keep extensions separate from application data

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the pg_trgm extension to the extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
