
-- Create enum for shift status
CREATE TYPE public.shift_status AS ENUM ('open', 'full', 'closed');

-- Create enum for registration status  
CREATE TYPE public.registration_status AS ENUM ('active', 'pending_removal');

-- Create table for bar shifts
CREATE TABLE public.bar_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  min_people INTEGER NOT NULL CHECK (min_people > 0),
  max_people INTEGER NOT NULL CHECK (max_people >= min_people),
  remarks TEXT,
  status shift_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user registrations
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES public.bar_shifts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status registration_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin users (simple email-based system)
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bar_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bar_shifts (public read, admin write)
CREATE POLICY "Anyone can view bar shifts" 
  ON public.bar_shifts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage bar shifts" 
  ON public.bar_shifts 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- RLS Policies for registrations (public can insert, admins can manage)
CREATE POLICY "Anyone can view registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can register" 
  ON public.registrations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can manage registrations" 
  ON public.registrations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Admins can delete registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- RLS Policies for admin_users (only admins can view)
CREATE POLICY "Admins can view admin users" 
  ON public.admin_users 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Insert a default admin user (replace with your email)
INSERT INTO public.admin_users (email, name) 
VALUES ('admin@voetbalclub.nl', 'Admin Gebruiker');

-- Function to get registration count for a shift
CREATE OR REPLACE FUNCTION public.get_active_registration_count(shift_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.registrations
  WHERE shift_id = shift_uuid AND status = 'active';
$$;

-- Function to check if shift is full
CREATE OR REPLACE FUNCTION public.is_shift_full(shift_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT (
    SELECT COUNT(*) 
    FROM public.registrations 
    WHERE shift_id = shift_uuid AND status = 'active'
  ) >= (
    SELECT max_people 
    FROM public.bar_shifts 
    WHERE id = shift_uuid
  );
$$;

-- Trigger to update shift status based on registrations
CREATE OR REPLACE FUNCTION public.update_shift_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

-- Create trigger for registration changes
CREATE TRIGGER trigger_update_shift_status
  AFTER INSERT OR UPDATE OR DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shift_status();
