-- Add RLS policy for users to view their own registrations
CREATE POLICY "Users can view their own registrations" 
ON public.registrations 
FOR SELECT 
USING (
  -- Allow if user is authenticated and email matches their auth email
  auth.uid() IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Add RLS policy for users to update their own registrations to pending_removal
CREATE POLICY "Users can request unsubscribe for their own registrations" 
ON public.registrations 
FOR UPDATE 
USING (
  -- Allow if user is authenticated and email matches their auth email
  auth.uid() IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND
  status = 'active'
)
WITH CHECK (
  -- Only allow changing to pending_removal status
  status = 'pending_removal'
);