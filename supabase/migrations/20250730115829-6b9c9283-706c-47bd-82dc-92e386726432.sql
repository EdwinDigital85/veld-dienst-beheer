-- Check en drop alle functies die mogelijk oude types gebruiken
DROP FUNCTION IF EXISTS public.update_shift_status() CASCADE;

-- Recreate the function with correct types
CREATE OR REPLACE FUNCTION public.update_shift_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Make sure triggers exist for the updated function
DROP TRIGGER IF EXISTS update_shift_status_trigger ON public.registrations;
CREATE TRIGGER update_shift_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.update_shift_status();