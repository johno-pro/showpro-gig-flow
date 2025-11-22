-- Add buffer multiplier columns to artists
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS pre_multiplier NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS post_multiplier NUMERIC DEFAULT 1.0;

-- Add buffer columns to venues
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS buffer_hours NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS pre_multiplier NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS post_multiplier NUMERIC DEFAULT 1.0;

-- Create gig_types table
CREATE TABLE IF NOT EXISTS gig_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pre_multiplier NUMERIC DEFAULT 1.0,
  post_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add gig_type_id to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS gig_type_id UUID REFERENCES gig_types(id);

-- Enable timescaledb extension for tsrange
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Index for fast overlap queries
CREATE INDEX IF NOT EXISTS idx_bookings_overlap 
ON bookings USING GIST (
  tsrange(start_date::timestamp, finish_date::timestamp), 
  venue_id, 
  artist_id, 
  team_id
) WHERE status != 'cancelled';

-- Trigger function (full asymmetric buffer validation)
CREATE OR REPLACE FUNCTION validate_booking_overlaps_with_buffers()
RETURNS TRIGGER AS $$
DECLARE
  overlap_count INTEGER;
  venue_buffer NUMERIC := 1.0;
  venue_pre_mult NUMERIC := 1.0;
  venue_post_mult NUMERIC := 1.0;
  gig_pre_mult NUMERIC := 1.0;
  gig_post_mult NUMERIC := 1.0;
  artist_pre_mult NUMERIC := 1.0;
  artist_post_mult NUMERIC := 1.0;
  effective_pre NUMERIC;
  effective_post NUMERIC;
  pre_interval INTERVAL;
  post_interval INTERVAL;
  buffered_new_range TSRANGE;
  new_start TIMESTAMP;
  new_end TIMESTAMP;
BEGIN
  -- Convert dates to timestamps
  new_start := NEW.start_date::timestamp;
  new_end := COALESCE(NEW.finish_date::timestamp, NEW.start_date::timestamp);

  -- Artist validation (asymmetric per artist + base)
  IF NEW.artist_id IS NOT NULL THEN
    SELECT COALESCE(pre_multiplier, 1.0), COALESCE(post_multiplier, 1.0) 
    INTO artist_pre_mult, artist_post_mult 
    FROM artists WHERE id = NEW.artist_id;
    
    pre_interval := (1.0 * artist_pre_mult || ' hours')::INTERVAL;
    post_interval := (1.0 * artist_post_mult || ' hours')::INTERVAL;
    buffered_new_range := tsrange(new_start - pre_interval, new_end + post_interval);

    SELECT COUNT(*) INTO overlap_count
    FROM bookings
    WHERE artist_id = NEW.artist_id
      AND id != COALESCE(NEW.id, gen_random_uuid())
      AND status != 'cancelled'
      AND tsrange(start_date::timestamp, COALESCE(finish_date::timestamp, start_date::timestamp)) && buffered_new_range;

    IF overlap_count > 0 THEN
      RAISE EXCEPTION 'Artist needs ~% pre + ~% post buffer and is booked: % to %. Check Diary.', 
        pre_interval, post_interval, NEW.start_date, COALESCE(NEW.finish_date, NEW.start_date);
    END IF;
  END IF;

  -- Team validation (symmetric global 1h)
  IF NEW.team_id IS NOT NULL THEN
    pre_interval := '1 hour'::INTERVAL;
    post_interval := '1 hour'::INTERVAL;
    buffered_new_range := tsrange(new_start - pre_interval, new_end + post_interval);

    SELECT COUNT(*) INTO overlap_count
    FROM bookings
    WHERE team_id = NEW.team_id
      AND id != COALESCE(NEW.id, gen_random_uuid())
      AND status != 'cancelled'
      AND tsrange(start_date::timestamp, COALESCE(finish_date::timestamp, start_date::timestamp)) && buffered_new_range;

    IF overlap_count > 0 THEN
      RAISE EXCEPTION 'Team has overlapping commitments (with 1h pre/post buffer): % to %. Reschedule?', 
        NEW.start_date, COALESCE(NEW.finish_date, NEW.start_date);
    END IF;
  END IF;

  -- Venue validation (full asymmetry)
  IF NEW.venue_id IS NOT NULL THEN
    SELECT COALESCE(buffer_hours, 1.0), COALESCE(pre_multiplier, 1.0), COALESCE(post_multiplier, 1.0) 
    INTO venue_buffer, venue_pre_mult, venue_post_mult 
    FROM venues WHERE id = NEW.venue_id;
    
    IF NEW.gig_type_id IS NOT NULL THEN
      SELECT COALESCE(pre_multiplier, 1.0), COALESCE(post_multiplier, 1.0) 
      INTO gig_pre_mult, gig_post_mult 
      FROM gig_types WHERE id = NEW.gig_type_id;
    END IF;
    
    IF NEW.artist_id IS NOT NULL THEN
      SELECT COALESCE(pre_multiplier, 1.0), COALESCE(post_multiplier, 1.0) 
      INTO artist_pre_mult, artist_post_mult 
      FROM artists WHERE id = NEW.artist_id;
    END IF;
    
    effective_pre := venue_buffer * venue_pre_mult * gig_pre_mult * artist_pre_mult;
    effective_post := venue_buffer * venue_post_mult * gig_post_mult * artist_post_mult;

    pre_interval := (effective_pre || ' hours')::INTERVAL;
    post_interval := (effective_post || ' hours')::INTERVAL;
    buffered_new_range := tsrange(new_start - pre_interval, new_end + post_interval);

    SELECT COUNT(*) INTO overlap_count
    FROM bookings
    WHERE venue_id = NEW.venue_id
      AND id != COALESCE(NEW.id, gen_random_uuid())
      AND status != 'cancelled'
      AND tsrange(start_date::timestamp, COALESCE(finish_date::timestamp, start_date::timestamp)) && buffered_new_range;

    IF overlap_count > 0 THEN
      RAISE EXCEPTION 'Venue requires ~% pre + ~% post buffer (venue x gig x artist) and is booked: % to %. Shift dates?', 
        effective_pre, effective_post, NEW.start_date, COALESCE(NEW.finish_date, NEW.start_date);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS bookings_overlap_prevent ON bookings;

CREATE TRIGGER bookings_overlap_prevent
  BEFORE INSERT OR UPDATE OF start_date, finish_date, artist_id, venue_id, gig_type_id, team_id, status
  ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_overlaps_with_buffers();

-- Enable RLS on gig_types
ALTER TABLE gig_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gig_types_read" ON gig_types FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "gig_types_manage" ON gig_types FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));