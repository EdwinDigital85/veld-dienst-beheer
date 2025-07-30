-- Fix the bar_shifts table to ensure it uses the correct status column type
ALTER TABLE public.bar_shifts 
ALTER COLUMN status TYPE shift_status USING status::text::shift_status;

-- Fix the registrations table to ensure it uses the correct status column type  
ALTER TABLE public.registrations
ALTER COLUMN status TYPE registration_status USING status::text::registration_status;