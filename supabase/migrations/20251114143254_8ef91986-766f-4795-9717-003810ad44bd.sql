-- Add status column to all form tables for draft support
ALTER TABLE locations ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE booking_series ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE departments ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE invoice_batches ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add indexes for efficient draft queries
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_series_status ON booking_series(status);
CREATE INDEX IF NOT EXISTS idx_artists_status ON artists(status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_invoice_batches_status ON invoice_batches(status);