-- Fix the status column type in registrations table
ALTER TABLE public.registrations 
ALTER COLUMN status TYPE registration_status 
USING status::text::registration_status;