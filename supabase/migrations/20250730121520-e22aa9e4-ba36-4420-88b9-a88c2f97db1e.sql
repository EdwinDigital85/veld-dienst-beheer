-- Fix the registrations status column type definitively
-- First, drop all triggers and constraints that might reference this column
DROP TRIGGER IF EXISTS update_shift_status_trigger ON public.registrations;

-- Drop the status column completely
ALTER TABLE public.registrations DROP COLUMN IF EXISTS status CASCADE;

-- Add the status column back with the correct enum type
ALTER TABLE public.registrations ADD COLUMN status public.registration_status NOT NULL DEFAULT 'active'::public.registration_status;

-- Recreate the trigger
CREATE TRIGGER update_shift_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shift_status();