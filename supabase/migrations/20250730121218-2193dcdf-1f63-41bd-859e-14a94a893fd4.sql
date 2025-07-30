-- Check if anonymous users can still create registrations
-- Let's update the registrations table RLS policies to be more permissive

-- First, drop existing policies
DROP POLICY IF EXISTS "Anyone can create registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.registrations;

-- Recreate more permissive policies for public access
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