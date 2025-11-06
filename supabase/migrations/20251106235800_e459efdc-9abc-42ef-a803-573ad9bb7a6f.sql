-- Fix: Secure database views by ensuring they respect underlying table RLS policies
-- Views inherit RLS from their source tables when created with SECURITY INVOKER

-- Drop and recreate views with security_invoker to respect underlying table RLS
DROP VIEW IF EXISTS bookings_public_view;
CREATE VIEW bookings_public_view
WITH (security_invoker = true)
AS
SELECT 
  id,
  artist_id,
  client_id,
  location_id,
  venue_id,
  artist_status,
  client_status,
  start_date,
  start_time,
  finish_date,
  finish_time,
  description,
  notes,
  created_at,
  updated_at
FROM bookings;

DROP VIEW IF EXISTS artists_for_bookings;
CREATE VIEW artists_for_bookings
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  act_type
FROM artists;

DROP VIEW IF EXISTS locations_basic;
CREATE VIEW locations_basic
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  address,
  postcode,
  client_id,
  created_at,
  updated_at
FROM locations;

DROP VIEW IF EXISTS suppliers_basic;
CREATE VIEW suppliers_basic
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  address,
  created_at,
  updated_at
FROM suppliers;

DROP VIEW IF EXISTS contacts_basic;
CREATE VIEW contacts_basic
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  title,
  client_id,
  supplier_id,
  department_id,
  location_id AS park_id,
  created_at,
  updated_at
FROM contacts;

DROP VIEW IF EXISTS showpro_summary;
CREATE VIEW showpro_summary
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*) FROM bookings) AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') AS confirmed_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed', 'enquiry', 'pencil')) AS active_bookings,
  (SELECT COUNT(*) FROM bookings WHERE deposit_paid = false AND status = 'confirmed') AS unpaid_deposits,
  (SELECT COUNT(*) FROM bookings WHERE balance_paid = false AND status = 'confirmed') AS unpaid_balances,
  (SELECT COALESCE(SUM(sell_fee - COALESCE(deposit_amount, 0)), 0) FROM bookings WHERE balance_paid = false AND status = 'confirmed') AS outstanding_balance_value,
  (SELECT COUNT(*) FROM artists) AS total_artists,
  (SELECT COUNT(*) FROM clients) AS total_clients,
  (SELECT COUNT(*) FROM suppliers) AS total_suppliers,
  (SELECT COUNT(*) FROM emails_queue WHERE sent = false) AS queued_emails,
  (SELECT COUNT(*) FROM emails_queue WHERE sent = true) AS sent_emails,
  (SELECT MAX(updated_at) FROM bookings) AS last_booking_update,
  (SELECT MAX(updated_at) FROM artists) AS last_artist_update,
  (SELECT MAX(updated_at) FROM clients) AS last_client_update,
  (SELECT MAX(updated_at) FROM suppliers) AS last_supplier_update,
  (SELECT MAX(created_at) FROM emails_queue) AS last_email_update,
  NOW() AS generated_at;