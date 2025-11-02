-- ==========================================
-- SHOWPRO V1.5 DATABASE UPGRADE
-- Adds email queue, remittance tracking, and T&Cs system
-- ==========================================

-- 1️⃣ ADD NEW FIELDS TO BOOKINGS
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS accounts_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS remittance_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS remittance_date date,
ADD COLUMN IF NOT EXISTS terms_template_id uuid;

-- 2️⃣ CREATE TERMS & CONDITIONS TEMPLATE TABLE (must be created before foreign key reference)
CREATE TABLE IF NOT EXISTS public.terms_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name text NOT NULL,
    category text CHECK (category IN ('headline','artist','reindeer','general')) DEFAULT 'general',
    body_html text,
    last_updated timestamptz DEFAULT now(),
    active boolean DEFAULT true
);

COMMENT ON TABLE public.terms_templates IS 'Stores reusable terms and conditions templates for different booking types.';

-- Add the foreign key constraint after the table exists
ALTER TABLE public.bookings
ADD CONSTRAINT fk_bookings_terms_template
FOREIGN KEY (terms_template_id) REFERENCES public.terms_templates(id) ON DELETE SET NULL;

-- 3️⃣ CREATE EMAILS QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.emails_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    recipient_type text CHECK (recipient_type IN ('artist', 'client', 'supplier', 'accounts')),
    email_subject text,
    email_body text,
    approved_to_send boolean DEFAULT false,
    sent boolean DEFAULT false,
    sent_at timestamptz DEFAULT NULL,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.emails_queue IS 'Stores pending booking confirmation and reminder emails awaiting approval.';

-- 4️⃣ SAMPLE TEMPLATES
INSERT INTO public.terms_templates (template_name, category, body_html) VALUES
('Headline Act T&Cs','headline','<p>Headline act specific terms – travel, hospitality, and technical requirements apply.</p>'),
('General Artist T&Cs','artist','<p>Standard performance terms including deposit, cancellation, and liability clauses.</p>'),
('Reindeer Hire T&Cs','reindeer','<p>Animal welfare and handling conditions as required by DEFRA.</p>'),
('General Template','general','<p>Default terms for any unspecified category.</p>')
ON CONFLICT DO NOTHING;

-- 5️⃣ TRIGGER AUTO EMAIL DRAFT WHEN BOOKING CONFIRMED
CREATE OR REPLACE FUNCTION draft_confirmation_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.artist_status = 'confirmed' OR NEW.client_status = 'confirmed' THEN
    INSERT INTO public.emails_queue (booking_id, recipient_type, email_subject, email_body)
    VALUES
    (NEW.id, 'artist', 'Artist Booking Confirmation',
     'Booking for ' || (SELECT name FROM artists WHERE id = NEW.artist_id) ||
     ' confirmed with ' || (SELECT name FROM clients WHERE id = NEW.client_id) ||
     ' on ' || to_char(NEW.start_date, 'DD Mon YYYY') || '.'),
    (NEW.id, 'client', 'Client Booking Confirmation',
     'Artist ' || (SELECT name FROM artists WHERE id = NEW.artist_id) ||
     ' confirmed for your event on ' || to_char(NEW.start_date, 'DD Mon YYYY') || '.');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_draft_confirmation_email ON public.bookings;
CREATE TRIGGER trg_draft_confirmation_email
AFTER UPDATE OF artist_status, client_status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION draft_confirmation_email();

COMMENT ON FUNCTION draft_confirmation_email() IS 'Generates pending confirmation emails for approval when a booking is confirmed.';