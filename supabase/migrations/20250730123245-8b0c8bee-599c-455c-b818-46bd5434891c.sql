-- Get the current column info to see what's wrong
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'registrations' AND column_name = 'status';

-- Force recreate the status column with the correct type
ALTER TABLE public.registrations DROP COLUMN status;
ALTER TABLE public.registrations ADD COLUMN status registration_status NOT NULL DEFAULT 'active'::registration_status;