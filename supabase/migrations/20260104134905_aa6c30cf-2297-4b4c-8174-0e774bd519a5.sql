-- Create company_settings table for storing company configuration
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'ENTS PRO LTD',
  registered_address TEXT,
  company_number TEXT,
  vat_number TEXT,
  accounts_email TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_sort_code TEXT,
  bank_account_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update company settings"
ON public.company_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert company settings"
ON public.company_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.company_settings (
  company_name,
  registered_address,
  company_number,
  vat_number,
  accounts_email,
  bank_name,
  bank_account_name,
  bank_sort_code,
  bank_account_number
) VALUES (
  'ENTS PRO LTD',
  '28 Grafton Drive, Southport, PR8 2RN',
  '5591161',
  'GB278282957',
  'info@ents.pro',
  'Monzo – Business Account',
  'ENTS PRO LTD',
  '04-00-03',
  '54019533
');