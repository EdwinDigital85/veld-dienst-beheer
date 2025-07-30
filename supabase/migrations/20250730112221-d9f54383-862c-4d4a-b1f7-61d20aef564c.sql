-- Enable real-time updates for the registrations table
ALTER TABLE public.registrations REPLICA IDENTITY FULL;

-- Add the registrations table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;