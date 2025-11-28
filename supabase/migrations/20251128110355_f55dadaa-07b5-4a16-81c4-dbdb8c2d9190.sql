-- Add invoice_number to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Update invoices status to use proper enum values
-- First update existing records
UPDATE invoices SET status = 'draft' WHERE status = 'unpaid' OR status IS NULL;
UPDATE invoices SET status = 'paid' WHERE status = 'paid';

-- Add invoice_actions audit trail table
CREATE TABLE IF NOT EXISTS invoice_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'sent', 'cancelled', 'reactivated', 'paid')),
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Add payment tracking fields to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_paid BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS artist_paid BOOLEAN DEFAULT false;

-- Create index for faster invoice_actions queries
CREATE INDEX IF NOT EXISTS idx_invoice_actions_invoice_id ON invoice_actions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_actions_timestamp ON invoice_actions(timestamp DESC);

-- RLS policies for invoice_actions
ALTER TABLE invoice_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice actions"
  ON invoice_actions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view invoice actions"
  ON invoice_actions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Function to automatically create audit trail on invoice status change
CREATE OR REPLACE FUNCTION log_invoice_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO invoice_actions (invoice_id, action, user_id)
    VALUES (NEW.id, 'created', auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'sent' THEN
        INSERT INTO invoice_actions (invoice_id, action, user_id)
        VALUES (NEW.id, 'sent', auth.uid());
      ELSIF NEW.status = 'cancelled' THEN
        INSERT INTO invoice_actions (invoice_id, action, user_id)
        VALUES (NEW.id, 'cancelled', auth.uid());
      ELSIF NEW.status = 'paid' THEN
        INSERT INTO invoice_actions (invoice_id, action, user_id)
        VALUES (NEW.id, 'paid', auth.uid());
      ELSIF NEW.status = 'draft' AND OLD.status = 'cancelled' THEN
        INSERT INTO invoice_actions (invoice_id, action, user_id)
        VALUES (NEW.id, 'reactivated', auth.uid());
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invoice audit trail
DROP TRIGGER IF EXISTS trigger_log_invoice_action ON invoices;
CREATE TRIGGER trigger_log_invoice_action
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_action();

-- Function to update booking payment tracking when invoice is sent
CREATE OR REPLACE FUNCTION update_booking_on_invoice_sent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    UPDATE bookings 
    SET invoice_sent = true, invoiced = true
    WHERE id = NEW.booking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating booking when invoice is sent
DROP TRIGGER IF EXISTS trigger_update_booking_on_invoice_sent ON invoices;
CREATE TRIGGER trigger_update_booking_on_invoice_sent
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_on_invoice_sent();