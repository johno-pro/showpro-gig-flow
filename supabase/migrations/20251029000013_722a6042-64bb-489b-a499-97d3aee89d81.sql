-- Add additional fields to suppliers table to match client requirements
ALTER TABLE public.suppliers
ADD COLUMN company_number text,
ADD COLUMN vat_number text,
ADD COLUMN accounts_contact_name text,
ADD COLUMN accounts_contact_email text,
ADD COLUMN accounts_contact_phone text;