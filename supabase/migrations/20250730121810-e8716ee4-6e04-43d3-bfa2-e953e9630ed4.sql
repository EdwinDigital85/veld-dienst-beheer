-- Completely rebuild the registrations table to fix the type issue permanently
-- First, save any existing data
CREATE TEMPORARY TABLE temp_registrations AS 
SELECT shift_id, id, created_at, updated_at, name, email, phone
FROM public.registrations;

-- Drop the problematic table completely
DROP TABLE public.registrations CASCADE;

-- Recreate the table from scratch with correct types
CREATE TABLE public.registrations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    status public.registration_status NOT NULL DEFAULT 'active'::public.registration_status,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Restore the data
INSERT INTO public.registrations (shift_id, id, created_at, updated_at, name, email, phone, status)
SELECT shift_id, id, created_at, updated_at, name, email, phone, 'active'::public.registration_status
FROM temp_registrations;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Recreate all policies
CREATE POLICY "Public can create registrations" 
ON public.registrations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view registrations" 
ON public.registrations 
FOR SELECT 
USING (true);

CREATE POLICY "Public can update registrations" 
ON public.registrations 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete registrations" 
ON public.registrations 
FOR DELETE 
USING (is_admin(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)));

CREATE POLICY "Users can view their own registrations" 
ON public.registrations 
FOR SELECT 
USING (((auth.uid() IS NOT NULL) AND (email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));

-- Add the updated_at trigger
CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add the shift status update trigger
CREATE TRIGGER update_shift_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_shift_status();

-- Clean up
DROP TABLE temp_registrations;