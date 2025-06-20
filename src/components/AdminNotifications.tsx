
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Send, Loader2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface RegistrationNotification {
  registration_id: string;
  shift_id: string;
  name: string;
  email: string;
  shift_title: string;
  shift_date: string;
  start_time: string;
  end_time: string;
}

export default function AdminNotifications() {
  const [upcomingNotifications, setUpcomingNotifications] = useState<RegistrationNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchUpcomingNotifications = async (days: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_registrations_needing_notification", { notification_days: days });

      if (error) throw error;

      setUpcomingNotifications(data || []);
      toast({
        title: "Registraties geladen",
        description: `${data?.length || 0} registraties gevonden die een herinnering nodig hebben.`,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Fout",
        description: "Kon registraties niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReminders = async (days: number) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bar-shift-reminder', {
        body: { days }
      });

      if (error) throw error;

      toast({
        title: "Herinneringen verzonden",
        description: `${data.successful || 0} herinneringen succesvol verzonden.`,
      });

      // Refresh de lijst na verzending
      await fetchUpcomingNotifications(days);
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast({
        title: "Fout bij verzenden",
        description: "Er is een fout opgetreden bij het verzenden van herinneringen.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Herinneringen Beheren
          </CardTitle>
          <CardDescription>
            Verstuur email herinneringen naar ingeschreven personen voor aankomende bardiensten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  1 Week Vooraf
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => fetchUpcomingNotifications(7)}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    "Controleer 1-week herinneringen"
                  )}
                </Button>
                <Button 
                  onClick={() => sendReminders(7)}
                  disabled={sending || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Verstuur 1-week herinneringen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  3 Dagen Vooraf
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => fetchUpcomingNotifications(3)}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    "Controleer 3-dagen herinneringen"
                  )}
                </Button>
                <Button 
                  onClick={() => sendReminders(3)}
                  disabled={sending || loading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Verstuur 3-dagen herinneringen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {upcomingNotifications.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Te verzenden herinneringen</h3>
                <Badge variant="secondary">{upcomingNotifications.length} personen</Badge>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Naam</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Bardienst</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tijd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingNotifications.map((notification, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{notification.name}</TableCell>
                        <TableCell>{notification.email}</TableCell>
                        <TableCell>{notification.shift_title}</TableCell>
                        <TableCell>
                          {format(new Date(notification.shift_date), "dd MMM yyyy", { locale: nl })}
                        </TableCell>
                        <TableCell>{notification.start_time} - {notification.end_time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {upcomingNotifications.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Klik op een van de knoppen hierboven om te controleren welke herinneringen verzonden kunnen worden.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
