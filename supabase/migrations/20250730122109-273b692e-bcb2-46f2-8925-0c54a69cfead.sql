-- Add foreign key constraint between registrations and bar_shifts
ALTER TABLE public.registrations 
ADD CONSTRAINT fk_registrations_shift_id 
FOREIGN KEY (shift_id) REFERENCES public.bar_shifts(id) ON DELETE CASCADE;

-- Create RPC function to handle registration insertion with proper type casting
CREATE OR REPLACE FUNCTION public.insert_registration(
  p_shift_id uuid,
  p_name text,
  p_email text,
  p_phone text
)
RETURNS TABLE(
  id uuid,
  shift_id uuid,
  name text,
  email text,
  phone text,
  status registration_status,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.registrations (shift_id, name, email, phone, status)
  VALUES (p_shift_id, p_name, p_email, p_phone, 'active'::registration_status)
  RETURNING 
    registrations.id,
    registrations.shift_id,
    registrations.name,
    registrations.email,
    registrations.phone,
    registrations.status,
    registrations.created_at,
    registrations.updated_at;
$$;