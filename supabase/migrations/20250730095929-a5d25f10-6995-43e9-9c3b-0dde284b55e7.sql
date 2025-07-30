-- Fix all database functions to have immutable search_path
CREATE OR REPLACE FUNCTION public.get_active_registration_count(shift_uuid uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.registrations
  WHERE shift_id = shift_uuid AND status = 'active';
$function$;

CREATE OR REPLACE FUNCTION public.get_all_registrations_for_export()
 RETURNS TABLE(shift_date date, shift_title text, start_time time without time zone, end_time time without time zone, name text, email text, phone text, registration_date timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT 
    bs.shift_date,
    bs.title as shift_title,
    bs.start_time,
    bs.end_time,
    r.name,
    r.email,
    r.phone,
    r.created_at as registration_date
  FROM public.registrations r
  JOIN public.bar_shifts bs ON r.shift_id = bs.id
  WHERE r.status = 'active'
  ORDER BY bs.shift_date ASC, bs.start_time ASC, r.name ASC;
$function$;

CREATE OR REPLACE FUNCTION public.update_shift_status()
 RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  -- Update the shift status based on registration count
  UPDATE public.bar_shifts 
  SET status = CASE 
    WHEN public.is_shift_full(NEW.shift_id) THEN 'full'::shift_status
    ELSE 'open'::shift_status
  END,
  updated_at = now()
  WHERE id = NEW.shift_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_registrations_needing_notification(notification_days integer)
 RETURNS TABLE(registration_id uuid, shift_id uuid, name text, email text, shift_title text, shift_date date, start_time time without time zone, end_time time without time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT 
    r.id as registration_id,
    r.shift_id,
    r.name,
    r.email,
    bs.title as shift_title,
    bs.shift_date,
    bs.start_time,
    bs.end_time
  FROM public.registrations r
  JOIN public.bar_shifts bs ON r.shift_id = bs.id
  WHERE 
    r.status = 'active'
    AND bs.shift_date = CURRENT_DATE + INTERVAL '1 day' * notification_days
    AND NOT EXISTS (
      SELECT 1 FROM public.email_notifications en 
      WHERE en.registration_id = r.id 
      AND en.notification_type = CASE 
        WHEN notification_days = 7 THEN 'one_week'
        WHEN notification_days = 3 THEN 'three_days'
      END
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_shift_full(shift_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT (
    SELECT COUNT(*) 
    FROM public.registrations 
    WHERE shift_id = shift_uuid AND status = 'active'
  ) >= (
    SELECT max_people 
    FROM public.bar_shifts 
    WHERE id = shift_uuid
  );
$function$;