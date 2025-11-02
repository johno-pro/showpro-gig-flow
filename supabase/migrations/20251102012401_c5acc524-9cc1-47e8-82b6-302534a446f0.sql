-- Enable RLS on new tables
ALTER TABLE public.emails_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emails_queue
CREATE POLICY "Authenticated users can view emails queue"
ON public.emails_queue
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage emails queue"
ON public.emails_queue
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for terms_templates
CREATE POLICY "Authenticated users can view terms templates"
ON public.terms_templates
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage terms templates"
ON public.terms_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));