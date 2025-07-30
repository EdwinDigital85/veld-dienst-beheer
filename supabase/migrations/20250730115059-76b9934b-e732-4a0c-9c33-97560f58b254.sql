-- First, drop the policy that depends on the status column
DROP POLICY IF EXISTS "Users can request unsubscribe for their own registrations" ON public.registrations;

-- Now we can alter the column types
ALTER TABLE public.bar_shifts 
ALTER COLUMN status TYPE shift_status USING status::text::shift_status;

ALTER TABLE public.registrations
ALTER COLUMN status TYPE registration_status USING status::text::registration_status;

-- Recreate the RLS policy with proper types
CREATE POLICY "Users can request unsubscribe for their own registrations" 
ON public.registrations 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL) 
  AND (email = (
    SELECT users.email
    FROM auth.users
    WHERE users.id = auth.uid()
  )::text) 
  AND (status = 'active'::registration_status)
)
WITH CHECK (status = 'pending_removal'::registration_status);