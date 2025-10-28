-- Add job_code column to bookings table
ALTER TABLE public.bookings
ADD COLUMN job_code text UNIQUE;

-- Create a sequence for job codes starting at 5501
CREATE SEQUENCE IF NOT EXISTS booking_job_code_seq START WITH 5501;

-- Create a function to generate job codes
CREATE OR REPLACE FUNCTION public.generate_job_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_code text;
BEGIN
  next_code := nextval('booking_job_code_seq')::text;
  RETURN next_code;
END;
$$;

-- Set default for job_code to use the generator
ALTER TABLE public.bookings
ALTER COLUMN job_code SET DEFAULT generate_job_code();