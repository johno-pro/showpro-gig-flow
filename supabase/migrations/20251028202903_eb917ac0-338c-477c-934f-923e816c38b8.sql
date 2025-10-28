-- Fix the function to have proper search_path set
CREATE OR REPLACE FUNCTION public.generate_job_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_code text;
BEGIN
  next_code := nextval('booking_job_code_seq')::text;
  RETURN next_code;
END;
$$;