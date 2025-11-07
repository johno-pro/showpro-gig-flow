-- Add email preferences and notification settings to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_preferences jsonb DEFAULT '{"marketing": false, "bookings": true, "reminders": true}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"email": true, "sms": false, "push": false}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.email_preferences IS 'User email preferences: marketing, bookings, reminders';
COMMENT ON COLUMN public.profiles.notification_settings IS 'Notification delivery preferences: email, sms, push';