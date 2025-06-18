import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Users, MessageSquare, LogOut } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import RegistrationForm from "@/components/RegistrationForm";
import AdminLogin from "@/components/AdminLogin";
import UnsubscribeModal from "@/components/UnsubscribeModal";
import BarShiftCalendar from "@/components/BarShiftCalendar";

interface BarShift {
  id: string;
  title: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  min_people: number;
  max_people: number;
  remarks: string | null;
  status: "open" | "full" | "closed";
}

export default function Index() {
  const [barShifts, setBarShifts] = useState<BarShift[]>([]);
  const [selectedShift, setSelectedShift] = useState<BarShift | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [registrationNames, setRegistrationNames] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarShifts();
  }, []);

  const fetchBarShifts = async () => {
    try {
      const { data: shifts, error } = await supabase
        .from("bar_shifts")
        .select("*")
        .order("shift_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      setBarShifts(shifts || []);

      // Fetch registration counts and names for each shift
      const counts: Record<string, number> = {};
      const names: Record<string, string[]> = {};
      
      for (const shift of shifts || []) {
        const { data: countData } = await supabase
          .rpc("get_active_registration_count", { shift_uuid: shift.id });
        counts[shift.id] = countData || 0;

        // Fetch registration names
        const { data: registrations } = await supabase
          .from("registrations")
          .select("name")
          .eq("shift_id", shift.id)
          .eq("status", "active");
        
        names[shift.id] = registrations?.map(r => r.name) || [];
      }
      
      setRegistrationCounts(counts);
      setRegistrationNames(names);
    } catch (error) {
      console.error("Error fetching bar shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setSelectedShift(null);
    fetchBarShifts();
  };

  const getStatusBadge = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    
    if (shift.status === "closed") {
      return <Badge variant="destructive">Gesloten</Badge>;
    }
    if (shift.status === "full" || count >= shift.max_people) {
      return <Badge variant="destructive">Vol ({count}/{shift.max_people})</Badge>;
    }
    return <Badge variant="secondary">{count}/{shift.max_people} personen</Badge>;
  };

  const canRegister = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    return shift.status === "open" && count < shift.max_people;
  };

  const generateCalendarEvent = (shift: BarShift) => {
    const startDateTime = new Date(`${shift.shift_date}T${shift.start_time}`);
    const endDateTime = new Date(`${shift.shift_date}T${shift.end_time}`);
    
    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(shift.title);
    const details = encodeURIComponent(`Bardienst: ${shift.title}`);
    const location = encodeURIComponent("Voetbalclub");
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateTime(startDateTime)}/${formatDateTime(endDateTime)}&details=${details}&location=${location}`;
    
    window.open(googleUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c6be0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Bardiensten laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-md border-b-4 border-[#0c6be0]">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/cae344b2-9f96-4d55-97c3-b84fadef3473.png" 
                alt="v.v. Boskant Logo" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bardiensten</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">v.v. Boskant - Vrijwilligersrooster</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowUnsubscribe(true)}
                className="bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700 text-sm"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Uitschrijven
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdminLogin(true)}
                className="bg-[#0c6be0] text-white border-[#0c6be0] hover:bg-[#0952b8] hover:border-[#0952b8] text-sm"
                size="sm"
              >
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="text-sm">Kalender Overzicht</TabsTrigger>
            <TabsTrigger value="list" className="text-sm">Lijst Weergave</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <BarShiftCalendar onShiftSelect={setSelectedShift} />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            {barShifts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">Geen bardiensten beschikbaar</h2>
                <p className="text-gray-500">Er zijn momenteel geen bardiensten gepland.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {barShifts.map((shift) => {
                  const count = registrationCounts[shift.id] || 0;
                  const names = registrationNames[shift.id] || [];
                  const shiftDate = new Date(shift.shift_date);
                  const isFull = count >= shift.max_people || shift.status === "full";
                  const isAvailable = canRegister(shift);
                  
                  return (
                    <Card key={shift.id} className={`hover:shadow-lg transition-shadow border-l-4 ${
                      isFull ? 'border-l-red-500 bg-red-50/30' : 'border-l-[#0c6be0]'
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base sm:text-lg text-gray-800 leading-tight">{shift.title}</CardTitle>
                          {getStatusBadge(shift)}
                        </div>
                        <CardDescription className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarDays className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              {format(shiftDate, "EEEE d MMMM yyyy", { locale: nl })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">
                              {shift.start_time} - {shift.end_time}
                            </span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-[#0c6be0] flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">
                              {count}/{shift.max_people} personen
                              {isFull && <span className="text-red-600 ml-2">(VOL)</span>}
                            </span>
                          </div>
                        </div>

                        {names.length > 0 && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            <p className="font-medium mb-1 text-xs sm:text-sm">Ingeschreven:</p>
                            <p className="text-xs sm:text-sm">{names.join(', ')}</p>
                          </div>
                        )}

                        {shift.remarks && (
                          <div className="flex items-start text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                            <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-xs sm:text-sm">{shift.remarks}</p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => setSelectedShift(shift)}
                            disabled={!isAvailable}
                            className={`flex-1 text-sm ${
                              isAvailable 
                                ? "bg-[#0c6be0] hover:bg-[#0952b8]" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            size="sm"
                          >
                            {isFull ? "Vol - Niet beschikbaar" : 
                             shift.status === "closed" ? "Gesloten" : 
                             "Inschrijven"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateCalendarEvent(shift)}
                            className="whitespace-nowrap text-sm"
                          >
                            + Agenda
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Registration Modal */}
      {selectedShift && (
        <RegistrationForm
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin onClose={() => setShowAdminLogin(false)} />
      )}

      {/* Unsubscribe Modal */}
      {showUnsubscribe && (
        <UnsubscribeModal onClose={() => setShowUnsubscribe(false)} />
      )}
    </div>
  );
}
