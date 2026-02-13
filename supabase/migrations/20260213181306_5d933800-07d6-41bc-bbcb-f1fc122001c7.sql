
-- Fix 1: Restrict company_settings SELECT to admin/manager only (was open to all authenticated)
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON public.company_settings;

CREATE POLICY "Admins and managers can view company settings"
ON public.company_settings
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Fix 2: Add RLS policies to oauth_states table
CREATE POLICY "Users can manage their own oauth states"
ON public.oauth_states
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
