
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, Users, MessageSquare, LogOut } from "lucide-react";
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

      // Fetch registration counts for each shift
      const counts: Record<string, number> = {};
      for (const shift of shifts || []) {
        const { data: countData } = await supabase
          .rpc("get_active_registration_count", { shift_uuid: shift.id });
        counts[shift.id] = countData || 0;
      }
      setRegistrationCounts(counts);
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
      return <Badge variant="destructive">Vol</Badge>;
    }
    if (count >= shift.min_people) {
      return <Badge className="bg-green-500 hover:bg-green-600">Voldoende</Badge>;
    }
    return <Badge variant="secondary">Open</Badge>;
  };

  const canRegister = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    return shift.status === "open" && count < shift.max_people;
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
      {/* Header */}
      <header className="bg-[#0c6be0] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Bardiensten</h1>
              <p className="text-blue-100 mt-1">Voetbalclub - Vrijwilligersrooster</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUnsubscribe(true)}
                className="bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Uitschrijven
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdminLogin(true)}
                className="bg-white text-[#0c6be0] hover:bg-gray-100 border-white"
              >
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Kalender Overzicht</TabsTrigger>
            <TabsTrigger value="list">Lijst Weergave</TabsTrigger>
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {barShifts.map((shift) => {
                  const count = registrationCounts[shift.id] || 0;
                  const shiftDate = new Date(shift.shift_date);
                  
                  return (
                    <Card key={shift.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-[#0c6be0]">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg text-gray-800">{shift.title}</CardTitle>
                          {getStatusBadge(shift)}
                        </div>
                        <CardDescription className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            {format(shiftDate, "EEEE d MMMM yyyy", { locale: nl })}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {shift.start_time} - {shift.end_time}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-[#0c6be0]" />
                            <span className="font-medium">{count}/{shift.max_people}</span>
                            <span className="text-gray-500 ml-1">ingeschreven</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Min: {shift.min_people}
                          </div>
                        </div>

                        {shift.remarks && (
                          <div className="flex items-start text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <p>{shift.remarks}</p>
                          </div>
                        )}

                        <Button
                          onClick={() => setSelectedShift(shift)}
                          disabled={!canRegister(shift)}
                          className="w-full bg-[#0c6be0] hover:bg-[#0952b8] disabled:bg-gray-300"
                        >
                          {!canRegister(shift) ? "Niet beschikbaar" : "Inschrijven"}
                        </Button>
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
