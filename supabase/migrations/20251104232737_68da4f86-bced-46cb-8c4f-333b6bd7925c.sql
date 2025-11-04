-- Fix security warnings: Set search_path for functions

-- Update calculate_artist_profit function with secure search_path
CREATE OR REPLACE FUNCTION public.calculate_artist_profit(p_sell_fee numeric, p_buy_fee numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_buy_fee IS NULL OR p_buy_fee = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ROUND(((p_sell_fee - p_buy_fee) / p_buy_fee * 100)::numeric, 2);
END;
$$;

-- Update calculate_booking_vat function with secure search_path
CREATE OR REPLACE FUNCTION public.calculate_booking_vat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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