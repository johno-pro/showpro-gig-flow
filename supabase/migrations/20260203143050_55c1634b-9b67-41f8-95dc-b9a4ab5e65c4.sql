-- Create a secure admin view that excludes sensitive OAuth tokens
CREATE OR REPLACE VIEW public.profiles_admin_view
WITH (security_invoker=on) AS
SELECT 
  id, 
  email, 
  full_name, 
  avatar_url, 
  created_at, 
  updated_at,
  email_preferences, 
  notification_settings,
  google_calendar_token_expiry,
  CASE WHEN google_calendar_token IS NOT NULL THEN true ELSE false END as has_google_calendar
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_admin_view TO authenticated;