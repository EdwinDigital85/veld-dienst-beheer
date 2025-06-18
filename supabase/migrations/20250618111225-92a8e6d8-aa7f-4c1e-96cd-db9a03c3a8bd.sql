
-- Fix the infinite recursion issue in admin_users RLS policy
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create a security definer function to safely check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- Create a new, safe policy for admin_users
CREATE POLICY "Admins can view admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (public.is_admin(current_setting('request.jwt.claims', true)::json->>'email'));

-- Also update the other policies to use the same function for consistency
DROP POLICY IF EXISTS "Admins can manage bar shifts" ON public.bar_shifts;
CREATE POLICY "Admins can manage bar shifts" 
  ON public.bar_shifts 
  FOR ALL 
  USING (public.is_admin(current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "Admins can manage registrations" ON public.registrations;
CREATE POLICY "Admins can manage registrations" 
  ON public.registrations 
  FOR UPDATE 
  USING (public.is_admin(current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
CREATE POLICY "Admins can delete registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (public.is_admin(current_setting('request.jwt.claims', true)::json->>'email'));
