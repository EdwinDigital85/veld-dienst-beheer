-- Check what enum types exist and fix this once and for all
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Let's just use the direct insert without any enum casting since the default should handle it
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.registrations (shift_id, name, email, phone)
  VALUES (p_shift_id, p_name, p_email, p_phone)
  RETURNING 
    registrations.id,
    registrations.shift_id,
    registrations.name,
    registrations.email,
    registrations.phone,
    registrations.status::text,
    registrations.created_at,
    registrations.updated_at;
END;
$$;