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

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount_due numeric NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'unpaid',
  payment_link text,
  artist_payment_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Admins can manage invoices"
ON public.invoices
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view invoices"
ON public.invoices
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Add missing fields to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
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

-- Add trigger for invoices updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index on invoices for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);