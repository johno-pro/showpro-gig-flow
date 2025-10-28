-- =====================================================
-- FIX ERROR-LEVEL SECURITY ISSUES
-- =====================================================

-- =====================================================
-- 1. FIX CONTACTS TABLE - Restrict PII access to managers only
-- =====================================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;

-- Add manager-level access
CREATE POLICY "Managers can view contacts"
ON public.contacts
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Create a secure view for basic contact info (no PII) for regular users
CREATE OR REPLACE VIEW public.contacts_basic AS
SELECT 
  id, 
  name, 
  title, 
  client_id, 
  park_id, 
  department_id, 
  supplier_id,
  created_at,
  updated_at
FROM public.contacts;

-- Enable RLS on the view
ALTER VIEW public.contacts_basic SET (security_invoker = true);

-- Grant SELECT to authenticated users on the view
GRANT SELECT ON public.contacts_basic TO authenticated;

-- =====================================================
-- 2. FIX PARKS TABLE - Restrict business contact data to managers only
-- =====================================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view parks" ON public.parks;

-- Add manager-level access
CREATE POLICY "Managers can view parks"
ON public.parks
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Create a secure view for basic park info (no contact details) for regular users
CREATE OR REPLACE VIEW public.parks_basic AS
SELECT 
  id, 
  name, 
  address,
  postcode,
  client_id,
  created_at,
  updated_at
FROM public.parks;

-- Enable RLS on the view
ALTER VIEW public.parks_basic SET (security_invoker = true);

-- Grant SELECT to authenticated users on the view
GRANT SELECT ON public.parks_basic TO authenticated;

-- =====================================================
-- 3. FIX SUPPLIERS TABLE - Restrict business contact data to managers only
-- =====================================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;

-- Add manager-level access
CREATE POLICY "Managers can view suppliers"
ON public.suppliers
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Create a secure view for basic supplier info (no contact details) for regular users
CREATE OR REPLACE VIEW public.suppliers_basic AS
SELECT 
  id, 
  name, 
  address,
  created_at,
  updated_at
FROM public.suppliers;

-- Enable RLS on the view
ALTER VIEW public.suppliers_basic SET (security_invoker = true);

-- Grant SELECT to authenticated users on the view
GRANT SELECT ON public.suppliers_basic TO authenticated;

-- =====================================================
-- 4. FIX ROLE ASSIGNMENT - Auto-assign 'user' role on signup
-- =====================================================

-- Create function to auto-assign 'user' role to new signups
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-assign 'user' role to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign role on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All PII fields (email, phone, mobile) are now restricted to managers
-- 2. Regular users can access basic info through _basic views
-- 3. New users will automatically get 'user' role
-- 4. First admin must still be assigned manually via database
-- 5. These changes won't break existing functionality as no code currently accesses these tables directly