
-- Voeg een tabel toe voor email notificaties tracking
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('one_week', 'three_days')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index voor betere performance bij queries
CREATE INDEX idx_email_notifications_registration_id ON public.email_notifications(registration_id);
CREATE INDEX idx_email_notifications_type ON public.email_notifications(notification_type);

-- RLS policies voor email_notifications tabel
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Alleen admins kunnen email notificaties bekijken
CREATE POLICY "Admins can view email notifications" 
  ON public.email_notifications 
  FOR SELECT 
  USING (public.is_admin((SELECT email FROM public.admin_users WHERE email = auth.jwt() ->> 'email')));

-- Database functie om registraties te vinden die een notificatie nodig hebben
CREATE OR REPLACE FUNCTION public.get_registrations_needing_notification(notification_days INTEGER)
RETURNS TABLE (
  registration_id UUID,
  shift_id UUID,
  name TEXT,
  email TEXT,
  shift_title TEXT,
  shift_date DATE,
  start_time TIME,
  end_time TIME
)
LANGUAGE SQL
STABLE
AS $$
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
$$;

-- Functie om alle registraties op te halen voor admin export (gesorteerd op datum)
CREATE OR REPLACE FUNCTION public.get_all_registrations_for_export()
RETURNS TABLE (
  shift_date DATE,
  shift_title TEXT,
  start_time TIME,
  end_time TIME,
  name TEXT,
  email TEXT,
  phone TEXT,
  registration_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
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
$$;
