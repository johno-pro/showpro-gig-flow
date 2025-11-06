-- Fix 1: Remove automatic artist role assignment on signup
-- This prevents unauthorized users from immediately gaining access to all business data
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Fix 2: Secure artist-invoices storage bucket with restrictive RLS policies
-- Drop overly permissive policies that allowed all users to access all invoices
DROP POLICY IF EXISTS "Authenticated users can view artist invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload artist invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update artist invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete artist invoices" ON storage.objects;

-- Create restrictive policies: Artists can only access their own invoices
-- Policy 1: Artists can view their own invoices, admins/managers can view all
CREATE POLICY "Artists view own invoices, admins view all" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'artist-invoices' AND (
    -- Artists can view files that start with their artist_id
    name LIKE (SELECT id::text || '%' FROM artists WHERE user_id = auth.uid())
    OR
    -- Admins and managers can view all invoices
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Policy 2: Artists can upload their own invoices, admins/managers can upload any
CREATE POLICY "Artists upload own invoices, admins upload any" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'artist-invoices' AND (
    -- Artists can upload files that start with their artist_id
    name LIKE (SELECT id::text || '%' FROM artists WHERE user_id = auth.uid())
    OR
    -- Admins and managers can upload any invoice
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Policy 3: Only admins can update invoices
CREATE POLICY "Only admins can update invoices" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'artist-invoices' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policy 4: Only admins can delete invoices
CREATE POLICY "Only admins can delete invoices" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'artist-invoices' AND
  has_role(auth.uid(), 'admin'::app_role)
);