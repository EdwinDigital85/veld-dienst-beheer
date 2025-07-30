-- Drop and recreate the function with correct enum casting
DROP FUNCTION IF EXISTS public.update_shift_status() CASCADE;

-- Recreate the function with proper enum type references
CREATE OR REPLACE FUNCTION public.update_shift_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update the shift status based on registration count
  UPDATE public.bar_shifts 
  SET status = CASE 
    WHEN public.is_shift_full(NEW.shift_id) THEN 'full'
    ELSE 'open'
  END,
  updated_at = now()
  WHERE id = NEW.shift_id;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_shift_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shift_status();