-- Add missing fields to artists table
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS invoice_upload_url text,
ADD COLUMN IF NOT EXISTS buy_fee numeric,
ADD COLUMN IF NOT EXISTS sell_fee numeric,
ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 20;

-- Add missing fields to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS ents_contact_name text,
ADD COLUMN IF NOT EXISTS ents_contact_mobile text,
ADD COLUMN IF NOT EXISTS ents_contact_email text,
ADD COLUMN IF NOT EXISTS upload_history jsonb DEFAULT '[]'::jsonb;

-- Add missing fields to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS billing_address text,
ADD COLUMN IF NOT EXISTS invoice_preferences text,
ADD COLUMN IF NOT EXISTS email_targets jsonb DEFAULT '[]'::jsonb;

-- Add missing fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS arrival_time time,
ADD COLUMN IF NOT EXISTS performance_times text,
ADD COLUMN IF NOT EXISTS vat_in numeric,
ADD COLUMN IF NOT EXISTS vat_out numeric,
ADD COLUMN IF NOT EXISTS confirmation_link text,
ADD COLUMN IF NOT EXISTS invoice_status text DEFAULT 'uninvoiced',
ADD COLUMN IF NOT EXISTS placeholder boolean DEFAULT false;

-- Add missing fields to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS method text,
ADD COLUMN IF NOT EXISTS artist_portion numeric;

-- Add missing fields to emails_queue table
ALTER TABLE public.emails_queue 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS recipients jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create function to calculate profit percentage for artists
CREATE OR REPLACE FUNCTION public.calculate_artist_profit(p_sell_fee numeric, p_buy_fee numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_buy_fee IS NULL OR p_buy_fee = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND(((p_sell_fee - p_buy_fee) / p_buy_fee * 100)::numeric, 2);
END;
$$;

-- Create function to calculate VAT amounts for bookings
CREATE OR REPLACE FUNCTION public.calculate_booking_vat()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_vat_rate numeric;
BEGIN
  -- Get VAT rate from artist or use default 20%
  SELECT COALESCE(vat_rate, 20) INTO v_vat_rate
  FROM public.artists
  WHERE id = NEW.artist_id;
  
  -- Calculate VAT In (on buy fee)
  IF NEW.buy_fee IS NOT NULL THEN
    NEW.vat_in := ROUND((NEW.buy_fee * v_vat_rate / 100)::numeric, 2);
  END IF;
  
  -- Calculate VAT Out (on sell fee)
  IF NEW.sell_fee IS NOT NULL THEN
    NEW.vat_out := ROUND((NEW.sell_fee * v_vat_rate / 100)::numeric, 2);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate VAT on bookings
DROP TRIGGER IF EXISTS trigger_calculate_booking_vat ON public.bookings;
CREATE TRIGGER trigger_calculate_booking_vat
  BEFORE INSERT OR UPDATE OF buy_fee, sell_fee, artist_id
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_booking_vat();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);