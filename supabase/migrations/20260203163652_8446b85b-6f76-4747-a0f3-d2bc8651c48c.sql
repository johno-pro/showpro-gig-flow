-- First, drop the dependent view
DROP VIEW IF EXISTS public.profiles_admin_view;

-- Create oauth_credentials table to store sensitive tokens securely
-- This table should only be accessible via service role, not by users directly
CREATE TABLE IF NOT EXISTS public.oauth_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL DEFAULT 'google_calendar',
    access_token text,
    refresh_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- Enable RLS but with NO user-facing policies (service role only)
ALTER TABLE public.oauth_credentials ENABLE ROW LEVEL SECURITY;

-- Migrate existing tokens from profiles to oauth_credentials
INSERT INTO public.oauth_credentials (user_id, provider, access_token, refresh_token, created_at, updated_at)
SELECT 
    id as user_id,
    'google_calendar' as provider,
    google_calendar_token as access_token,
    google_calendar_refresh_token as refresh_token,
    now() as created_at,
    now() as updated_at
FROM public.profiles
WHERE google_calendar_token IS NOT NULL OR google_calendar_refresh_token IS NOT NULL
ON CONFLICT (user_id, provider) DO NOTHING;

-- Remove sensitive token columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS google_calendar_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS google_calendar_refresh_token;

-- Recreate profiles_admin_view without the token columns (they no longer exist)
CREATE VIEW public.profiles_admin_view
WITH (security_invoker=on) AS
SELECT 
    id,
    email,
    full_name,
    avatar_url,
    email_preferences,
    notification_settings,
    google_calendar_token_expiry,
    created_at,
    updated_at
FROM public.profiles;

-- Create trigger to update updated_at on oauth_credentials
CREATE OR REPLACE FUNCTION public.update_oauth_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_oauth_credentials_updated_at ON public.oauth_credentials;

CREATE TRIGGER update_oauth_credentials_updated_at
BEFORE UPDATE ON public.oauth_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_oauth_credentials_updated_at();