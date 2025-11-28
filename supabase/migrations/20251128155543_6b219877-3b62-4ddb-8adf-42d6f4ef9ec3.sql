-- Add act_code field to artists table
ALTER TABLE public.artists 
ADD COLUMN act_code TEXT;

-- Update the AlleyCatz to have ALLY as act_code
UPDATE public.artists 
SET act_code = 'ALLY' 
WHERE name = 'The Allycatz';

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_job_number_trigger ON public.bookings;
DROP FUNCTION IF EXISTS public.set_job_number();

-- Create updated function that uses artist act_code
CREATE OR REPLACE FUNCTION public.set_job_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_act_code TEXT;
  v_sequence_num INTEGER;
BEGIN
  -- Only set job_number if it's not already set
  IF NEW.job_number IS NULL THEN
    -- Get the act_code from the artist
    SELECT act_code INTO v_act_code
    FROM public.artists
    WHERE id = NEW.artist_id;
    
    -- Get next sequence number
    v_sequence_num := nextval('public.job_number_seq');
    
    -- Set job_number as ACTCODE/SEQUENCE
    IF v_act_code IS NOT NULL THEN
      NEW.job_number := v_act_code || '/' || v_sequence_num;
    ELSE
      -- Fallback if no act_code is set
      NEW.job_number := 'UNK/' || v_sequence_num;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER set_job_number_trigger
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_job_number();