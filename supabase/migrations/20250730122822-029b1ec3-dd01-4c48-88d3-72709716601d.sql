-- First drop the constraint if it exists
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_status_check;

-- Change the column type from shift_status to registration_status
ALTER TABLE public.registrations 
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.registrations 
ALTER COLUMN status TYPE registration_status 
USING CASE 
  WHEN status::text = 'active' THEN 'active'::registration_status
  WHEN status::text = 'pending_removal' THEN 'pending_removal'::registration_status
  ELSE 'active'::registration_status
END;

-- Set the default value
ALTER TABLE public.registrations 
ALTER COLUMN status SET DEFAULT 'active'::registration_status;