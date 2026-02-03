-- Fix overly permissive storage policies for documents bucket
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Create role-based storage policies for documents bucket
CREATE POLICY "Admins and managers can view documents storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

CREATE POLICY "Admins and managers can upload documents storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

CREATE POLICY "Admins can update documents storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete documents storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));