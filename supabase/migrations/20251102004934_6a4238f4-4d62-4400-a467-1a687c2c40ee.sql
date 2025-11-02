-- ==========================================
-- SHOWPRO BOOKINGS PAGE — DATABASE MIGRATION
-- Compatible with existing schema
-- ==========================================

-- Create financial_mode enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_mode') THEN
    CREATE TYPE financial_mode AS ENUM ('commission', 'third_party');
  END IF;
END$$;

-- Add new columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS supplier_contact_name text,
ADD COLUMN IF NOT EXISTS client_contact_name text,
ADD COLUMN IF NOT EXISTS location_contact_name text,
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS start_time time DEFAULT '19:00',
ADD COLUMN IF NOT EXISTS finish_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS finish_time time DEFAULT '23:30',
ADD COLUMN IF NOT EXISTS artist_status booking_status DEFAULT 'enquiry',
ADD COLUMN IF NOT EXISTS client_status booking_status DEFAULT 'enquiry',
ADD COLUMN IF NOT EXISTS financial_type financial_mode DEFAULT 'commission',
ADD COLUMN IF NOT EXISTS commission_percent numeric DEFAULT 15,
ADD COLUMN IF NOT EXISTS buy_fee numeric,
ADD COLUMN IF NOT EXISTS sell_fee numeric,
ADD COLUMN IF NOT EXISTS profit_percent numeric,
ADD COLUMN IF NOT EXISTS vat_rate numeric DEFAULT 20;

-- Create function to auto-update booking description
CREATE OR REPLACE FUNCTION update_booking_description()
RETURNS trigger AS $$
BEGIN
  NEW.description :=
    COALESCE((SELECT name FROM artists WHERE id = NEW.artist_id), '') || ' – ' ||
    COALESCE((SELECT name FROM clients WHERE id = NEW.client_id), '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for description update
DROP TRIGGER IF EXISTS trg_update_booking_description ON public.bookings;

CREATE TRIGGER trg_update_booking_description
BEFORE INSERT OR UPDATE OF artist_id, client_id
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_booking_description();

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_bookings ON public.bookings;

CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON TABLE public.bookings IS 'ShowPro Booking Table: integrates artist, supplier, client, and financial logic.';