-- Grant full access to authenticated users on all tables
GRANT ALL ON public.artists TO authenticated;
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.venues TO authenticated;