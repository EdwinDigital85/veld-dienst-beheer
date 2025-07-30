-- Fix the insert_registration function to use the correct enum type
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
  status text,
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
    registrations.status::text,
    registrations.created_at,
    registrations.updated_at;
$$;