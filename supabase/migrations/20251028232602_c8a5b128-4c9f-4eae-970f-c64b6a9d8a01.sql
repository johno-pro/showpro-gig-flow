-- Step 1: Create temporary table with artist mapping
CREATE TEMP TABLE artist_mapping AS
SELECT 
  a2.id as old_id,
  a1.id as new_id
FROM artists a1
JOIN artists a2 ON a1.name = a2.name AND a1.created_at < a2.created_at;

-- Step 2: Update bookings to reference the kept artist
UPDATE bookings b
SET artist_id = am.new_id
FROM artist_mapping am
WHERE b.artist_id = am.old_id;

-- Step 3: Delete duplicate artists
DELETE FROM artists
WHERE id IN (SELECT old_id FROM artist_mapping);

-- Step 4: Create temporary table with venue mapping
CREATE TEMP TABLE venue_mapping AS
SELECT 
  v2.id as old_id,
  v1.id as new_id
FROM venues v1
JOIN venues v2 ON v1.name = v2.name AND v1.created_at < v2.created_at;

-- Step 5: Update bookings to reference the kept venue
UPDATE bookings b
SET venue_id = vm.new_id
FROM venue_mapping vm
WHERE b.venue_id = vm.old_id;

-- Step 6: Delete duplicate venues
DELETE FROM venues
WHERE id IN (SELECT old_id FROM venue_mapping);