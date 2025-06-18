
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can register" ON public.registrations;
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;

-- Recreate policies with proper permissions
CREATE POLICY "Anyone can view registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create registrations" 
  ON public.registrations 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to update registrations (needed for unsubscribe functionality)
CREATE POLICY "Anyone can update registrations" 
  ON public.registrations 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Keep admin-only delete policy using the security definer function
CREATE POLICY "Admins can delete registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (public.is_admin(current_setting('request.jwt.claims', true)::json->>'email'));
