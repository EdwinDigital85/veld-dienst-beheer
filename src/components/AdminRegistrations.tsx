
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, User, Mail, Phone, AlertTriangle, Check, X } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "pending_removal";
  created_at: string;
  shift_id: string;
  bar_shifts: {
    title: string;
    shift_date: string;
    start_time: string;
    end_time: string;
  };
}

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending_removal");
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, statusFilter]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          *,
          bar_shifts (
            title,
            shift_date,
            start_time,
            end_time
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = registrations;
    
    if (statusFilter !== "all") {
      filtered = registrations.filter(reg => reg.status === statusFilter);
    }

    setFilteredRegistrations(filtered);
  };

  const approveRemoval = async (registrationId: string, registrationData: Registration) => {
    try {
      const { error } = await supabase
        .from("registrations")
        .delete()
        .eq("id", registrationId);

      if (error) throw error;

      toast({
        title: "Uitschrijving goedgekeurd",
        description: `${registrationData.name} is uitgeschreven voor ${registrationData.bar_shifts.title}.`,
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Error approving removal:", error);
      toast({
        title: "Fout",
        description: "Kon uitschrijving niet goedkeuren.",
        variant: "destructive",
      });
    }
  };

  const rejectRemoval = async (registrationId: string, registrationData: Registration) => {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ status: "active" })
        .eq("id", registrationId);

      if (error) throw error;

      toast({
        title: "Uitschrijving geweigerd",
        description: `${registrationData.name} blijft ingeschreven voor ${registrationData.bar_shifts.title}.`,
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Error rejecting removal:", error);
      toast({
        title: "Fout",
        description: "Kon uitschrijving niet weigeren.",
        variant: "destructive",
      });
    }
  };

  const deleteRegistration = async (registrationId: string, registrationData: Registration) => {
    if (!confirm(`Weet je zeker dat je de inschrijving van ${registrationData.name} wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("registrations")
        .delete()
        .eq("id", registrationId);

      if (error) throw error;

      toast({
        title: "Inschrijving verwijderd",
        description: `De inschrijving van ${registrationData.name} is verwijderd.`,
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Error deleting registration:", error);
      toast({
        title: "Fout",
        description: "Kon inschrijving niet verwijderen.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Actief</Badge>;
      case "pending_removal":
        return <Badge variant="destructive">Wacht op goedkeuring</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = registrations.filter(reg => reg.status === "pending_removal").length;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c6be0] mx-auto"></div>
        <p className="mt-4 text-gray-600">Inschrijvingen laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inschrijvingen & Uitschrijvingsverzoeken</h2>
          <p className="text-gray-600">
            {registrations.length} inschrijvingen totaal
            {pendingCount > 0 && (
              <span className="ml-2 text-orange-600 font-medium">
                ({pendingCount} uitschrijvingsverzoeken wachten op goedkeuring)
              </span>
            )}
          </p>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_removal">Uitschrijvingsverzoeken ({pendingCount})</SelectItem>
            <SelectItem value="active">Actieve inschrijvingen</SelectItem>
            <SelectItem value="all">Alle statussen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pendingCount > 0 && statusFilter !== "pending_removal" && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <p className="text-orange-800 font-medium">
              Er zijn {pendingCount} uitschrijvingsverzoeken die je aandacht nodig hebben.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("pending_removal")}
              className="ml-auto"
            >
              Bekijk verzoeken
            </Button>
          </div>
        </div>
      )}

      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {statusFilter === "pending_removal" ? "Geen uitschrijvingsverzoeken" : "Geen inschrijvingen"}
          </h3>
          <p className="text-gray-500">
            {statusFilter === "pending_removal" 
              ? "Er zijn momenteel geen uitschrijvingsverzoeken die goedkeuring nodig hebben."
              : statusFilter === "active"
              ? "Er zijn geen actieve inschrijvingen."
              : "Er zijn nog geen inschrijvingen voor bardiensten."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRegistrations.map((registration) => {
            const shiftDate = new Date(registration.bar_shifts.shift_date);
            
            return (
              <Card key={registration.id} className={`${
                registration.status === "pending_removal" 
                  ? "border-l-4 border-l-orange-500 bg-orange-50/50" 
                  : "border-l-4 border-l-[#0c6be0]"
              }`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-800">
                        {registration.bar_shifts.title}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          {format(shiftDate, "EEEE d MMMM yyyy", { locale: nl })}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {registration.bar_shifts.start_time} - {registration.bar_shifts.end_time}
                        </div>
                      </CardDescription>
                    </div>
                    {getStatusBadge(registration.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-[#0c6be0]" />
                      <span className="font-medium">{registration.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-[#0c6be0]" />
                      <span>{registration.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-[#0c6be0]" />
                      <span>{registration.phone}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Ingeschreven op: {format(new Date(registration.created_at), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                  </div>

                  {registration.status === "pending_removal" ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-800 mb-3 font-medium">
                        🔔 Deze persoon wil zich uitschrijven en wacht op jouw goedkeuring.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveRemoval(registration.id, registration)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Goedkeuren
                        </Button>
                        <Button
                          onClick={() => rejectRemoval(registration.id, registration)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Weigeren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => deleteRegistration(registration.id, registration)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Verwijderen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
