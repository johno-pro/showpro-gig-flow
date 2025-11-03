-- Add validation to prevent email header injection in emails_queue
ALTER TABLE emails_queue 
ADD CONSTRAINT no_newlines_in_subject 
CHECK (email_subject !~ '[\r\n]');

-- Add validation function for HTML content in terms_templates
CREATE OR REPLACE FUNCTION public.validate_html_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reject script tags to prevent XSS
  IF NEW.body_html ~* '<script' THEN
    RAISE EXCEPTION 'Script tags are not allowed in HTML content';
  END IF;
  
  -- Reject iframe tags
  IF NEW.body_html ~* '<iframe' THEN
    RAISE EXCEPTION 'Iframe tags are not allowed in HTML content';
  END IF;
  
  -- Reject event handlers (onclick, onerror, etc.)
  IF NEW.body_html ~* 'on(click|load|error|mouse|key)' THEN
    RAISE EXCEPTION 'JavaScript event handlers are not allowed in HTML content';
  END IF;
  
  -- Limit HTML content size (50KB)
  IF LENGTH(NEW.body_html) > 50000 THEN
    RAISE EXCEPTION 'HTML content exceeds maximum size of 50KB';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for HTML validation on terms_templates
DROP TRIGGER IF EXISTS validate_terms_html ON public.terms_templates;
CREATE TRIGGER validate_terms_html
  BEFORE INSERT OR UPDATE OF body_html ON public.terms_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_html_content();