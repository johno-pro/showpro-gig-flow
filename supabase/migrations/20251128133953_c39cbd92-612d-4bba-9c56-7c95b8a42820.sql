-- Create junction table for invoice batches and bookings
CREATE TABLE IF NOT EXISTS public.invoice_batch_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.invoice_batches(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(batch_id, booking_id)
);

-- Enable RLS
ALTER TABLE public.invoice_batch_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage invoice batch bookings"
  ON public.invoice_batch_bookings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "invoice_batch_bookings_read"
  ON public.invoice_batch_bookings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add batch_invoice_id to link batch to its VAR invoice
ALTER TABLE public.invoice_batches ADD COLUMN IF NOT EXISTS batch_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_invoice_batch_bookings_batch_id ON public.invoice_batch_bookings(batch_id);
CREATE INDEX IF NOT EXISTS idx_invoice_batch_bookings_booking_id ON public.invoice_batch_bookings(booking_id);