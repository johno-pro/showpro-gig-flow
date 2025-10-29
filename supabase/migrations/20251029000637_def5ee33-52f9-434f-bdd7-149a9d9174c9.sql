-- Add additional fields to clients table to match supplier structure
ALTER TABLE public.clients
ADD COLUMN company_number text,
ADD COLUMN vat_number text,
ADD COLUMN contact_name text,
ADD COLUMN contact_email text,
ADD COLUMN contact_phone text,
ADD COLUMN accounts_contact_name text,
ADD COLUMN accounts_contact_email text,
ADD COLUMN accounts_contact_phone text;