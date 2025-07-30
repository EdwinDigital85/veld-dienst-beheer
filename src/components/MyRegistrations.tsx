import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UserRegistration {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'pending_removal';
  created_at: string;
  bar_shifts: {
    title: string;
    shift_date: string;
    start_time: string;
    end_time: string;
  };
}

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetchMyRegistrations();
    }
  }, [isAuthenticated, user?.email]);

  const fetchMyRegistrations = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          name,
          email,
          phone,
          status,
          created_at,
          bar_shifts:shift_id (
            title,
            shift_date,
            start_time,
            end_time
          )
        `)
        .eq('email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: 'Fout bij laden',
        description: 'Kon je registraties niet laden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const requestUnsubscribe = async (registrationId: string, shiftTitle: string) => {
    if (!confirm(`Weet je zeker dat je je wilt uitschrijven voor "${shiftTitle}"? Dit verzoek moet door een admin worden goedgekeurd.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .update({ 
          status: 'pending_removal',
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId)
        .eq('status', 'active');

      if (error) throw error;

      toast({
        title: 'Uitschrijfverzoek verzonden',
        description: 'Je uitschrijfverzoek is verzonden naar de admin voor goedkeuring.',
      });

      // Refresh the list
      fetchMyRegistrations();
    } catch (error) {
      console.error('Error requesting unsubscribe:', error);
      toast({
        title: 'Fout bij uitschrijven',
        description: 'Er is een fout opgetreden. Probeer het opnieuw.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Actief</Badge>;
      case 'pending_removal':
        return <Badge variant="destructive">Uitschrijfverzoek ingediend</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mijn Registraties</CardTitle>
          <CardDescription>Je inschrijvingen voor bardiensten</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Laden...</p>
        </CardContent>
      </Card>
    );
  }

  if (registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mijn Registraties</CardTitle>
          <CardDescription>Je inschrijvingen voor bardiensten</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Je hebt je nog niet ingeschreven voor bardiensten.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mijn Registraties</CardTitle>
        <CardDescription>
          Je inschrijvingen voor bardiensten ({registrations.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {registrations.map((registration) => {
          const shiftDate = new Date(registration.bar_shifts.shift_date);
          const isPastShift = shiftDate < new Date();

          return (
            <Card key={registration.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {registration.bar_shifts.title}
                    </CardTitle>
                    <CardDescription className="space-y-1 mt-2">
                      <div className="flex items-center text-sm">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        {format(shiftDate, "EEEE d MMMM yyyy", { locale: nl })}
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        {registration.bar_shifts.start_time} - {registration.bar_shifts.end_time}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(registration.status)}
                    {registration.status === 'active' && !isPastShift && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestUnsubscribe(registration.id, registration.bar_shifts.title)}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Uitschrijven
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {registration.status === 'pending_removal' && (
                <CardContent className="pt-0">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                      <p className="text-orange-800 text-sm">
                        Je uitschrijfverzoek wacht op goedkeuring van de admin.
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}