-- Fix security warnings: Set search_path for functions

CREATE OR REPLACE FUNCTION update_booking_description()
RETURNS trigger AS $$
BEGIN
  NEW.description :=
    COALESCE((SELECT name FROM artists WHERE id = NEW.artist_id), '') || ' – ' ||
    COALESCE((SELECT name FROM clients WHERE id = NEW.client_id), '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;