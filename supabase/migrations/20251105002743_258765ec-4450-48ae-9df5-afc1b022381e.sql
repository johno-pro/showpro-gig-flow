-- Create storage bucket for artist invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artist-invoices',
  'artist-invoices',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
);

-- Allow authenticated users to upload artist invoices
CREATE POLICY "Authenticated users can upload artist invoices"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artist-invoices');

-- Allow authenticated users to view artist invoices
CREATE POLICY "Authenticated users can view artist invoices"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'artist-invoices');

-- Allow authenticated users to delete artist invoices
CREATE POLICY "Authenticated users can delete artist invoices"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'artist-invoices');

-- Allow authenticated users to update artist invoices
CREATE POLICY "Authenticated users can update artist invoices"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'artist-invoices');