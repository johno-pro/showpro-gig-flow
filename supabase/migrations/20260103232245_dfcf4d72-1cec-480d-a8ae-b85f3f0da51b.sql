-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_job_number_trigger ON public.bookings;

-- Create or replace the function to set job_code with act_code prefix
CREATE OR REPLACE FUNCTION public.set_job_code_with_prefix()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_act_code TEXT;
  v_sequence_num INTEGER;
BEGIN
  -- Only set job_code if it's not already set or is just a number
  IF NEW.job_code IS NULL OR NEW.job_code ~ '^\d+$' THEN
    -- Get the act_code from the artist
    SELECT act_code INTO v_act_code
    FROM public.artists
    WHERE id = NEW.artist_id;
    
    -- Get next sequence number (or keep existing if already a number)
    IF NEW.job_code ~ '^\d+$' THEN
      v_sequence_num := NEW.job_code::INTEGER;
    ELSE
      v_sequence_num := nextval('public.booking_job_code_seq');
    END IF;
    
    -- Set job_code as ACTCODE/SEQUENCE
    IF v_act_code IS NOT NULL AND v_act_code != '' THEN
      NEW.job_code := v_act_code || '/' || v_sequence_num;
    ELSE
      -- Fallback if no act_code is set - just use the number
      NEW.job_code := v_sequence_num::TEXT;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on insert and update
CREATE TRIGGER set_job_code_trigger
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_job_code_with_prefix();