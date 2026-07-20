
-- 1. Add authorization check to create_user_profile
CREATE OR REPLACE FUNCTION public.create_user_profile(p_user_id uuid, p_email text, p_full_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_full_name)
  ON CONFLICT (id) DO NOTHING;
END;
$function$;

-- 2. Revoke EXECUTE from PUBLIC on all SECURITY DEFINER functions in public schema.
REVOKE EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.draft_confirmation_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_booking_vat() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_job_code_with_prefix() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_invoice_action() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_booking_on_invoice_sent() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_job_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_html_content() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_booking_overlaps_with_buffers() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_oauth_states() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_artist_profit(numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_job_code() FROM PUBLIC, anon, authenticated;

-- 3. has_role must remain callable by signed-in users because RLS policies invoke it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
