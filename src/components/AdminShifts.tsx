
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Users, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile, useIsSmallMobile } from "@/hooks/use-mobile";

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

export default function AdminShifts() {
  const [barShifts, setBarShifts] = useState<BarShift[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

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

  const toggleShiftStatus = async (shiftId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "open" ? "closed" : "open";
      
      const { error } = await supabase
        .from("bar_shifts")
        .update({ status: newStatus })
        .eq("id", shiftId);

      if (error) throw error;

      toast({
        title: "Status gewijzigd",
        description: `Bardienst is nu ${newStatus === "open" ? "open" : "gesloten"}.`,
      });

      fetchBarShifts();
    } catch (error) {
      console.error("Error updating shift status:", error);
      toast({
        title: "Fout",
        description: "Kon status niet wijzigen.",
        variant: "destructive",
      });
    }
  };

  const deleteShift = async (shiftId: string) => {
    if (!confirm("Weet je zeker dat je deze bardienst wilt verwijderen? Dit kan niet ongedaan gemaakt worden.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("bar_shifts")
        .delete()
        .eq("id", shiftId);

      if (error) throw error;

      toast({
        title: "Bardienst verwijderd",
        description: "De bardienst is succesvol verwijderd.",
      });

      fetchBarShifts();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Fout",
        description: "Kon bardienst niet verwijderen.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    
    if (shift.status === "closed") {
      return <Badge variant="destructive" className={isSmallMobile ? 'text-xs px-2 py-1' : ''}>Gesloten</Badge>;
    }
    if (shift.status === "full" || count >= shift.max_people) {
      return <Badge variant="destructive" className={isSmallMobile ? 'text-xs px-2 py-1' : ''}>Vol</Badge>;
    }
    if (count >= shift.min_people) {
      return <Badge className={`bg-green-500 hover:bg-green-600 ${isSmallMobile ? 'text-xs px-2 py-1' : ''}`}>Voldoende</Badge>;
    }
    return <Badge variant="secondary" className={isSmallMobile ? 'text-xs px-2 py-1' : ''}>Open</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c6be0] mx-auto"></div>
        <p className="mt-4 text-gray-600">Bardiensten laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'}`}>
        <h2 className={`${isSmallMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
          Bardiensten Overzicht
        </h2>
        <p className={`text-gray-600 ${isSmallMobile ? 'text-sm' : ''}`}>
          {barShifts.length} bardiensten totaal
        </p>
      </div>

      {barShifts.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Geen bardiensten</h3>
          <p className="text-gray-500">Er zijn nog geen bardiensten aangemaakt.</p>
        </div>
      ) : (
        <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {barShifts.map((shift) => {
            const count = registrationCounts[shift.id] || 0;
            const shiftDate = new Date(shift.shift_date);
            
            return (
              <Card key={shift.id} className="border-l-4 border-l-[#0c6be0] shadow-lg">
                <CardHeader className={isSmallMobile ? 'pb-3' : ''}>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className={`${isSmallMobile ? 'text-base' : 'text-lg'} text-gray-800 flex-1 min-w-0`}>
                      <span className="line-clamp-2">{shift.title}</span>
                    </CardTitle>
                    <div className="flex-shrink-0">
                      {getStatusBadge(shift)}
                    </div>
                  </div>
                  <CardDescription className="space-y-2">
                    <div className={`flex items-center ${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                      <CalendarDays className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 flex-shrink-0`} />
                      <span className="truncate">
                        {format(shiftDate, "EEEE d MMMM yyyy", { locale: nl })}
                      </span>
                    </div>
                    <div className={`flex items-center ${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                      <Clock className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 flex-shrink-0`} />
                      <span>{shift.start_time} - {shift.end_time}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className={`space-y-4 ${isSmallMobile ? 'pt-0' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                      <Users className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-[#0c6be0] flex-shrink-0`} />
                      <span className="font-medium">{count}/{shift.max_people}</span>
                      <span className="text-gray-500 ml-1">ingeschreven</span>
                    </div>
                    <div className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                      Min: {shift.min_people}
                    </div>
                  </div>

                  {shift.remarks && (
                    <div className={`flex items-start ${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-600 bg-gray-50 p-3 rounded`}>
                      <MessageSquare className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 mt-0.5 flex-shrink-0`} />
                      <p className="line-clamp-3">{shift.remarks}</p>
                    </div>
                  )}

                  <div className={`flex gap-2 pt-2 ${isMobile ? 'flex-col' : ''}`}>
                    <Button
                      onClick={() => toggleShiftStatus(shift.id, shift.status)}
                      variant="outline"
                      size={isSmallMobile ? "sm" : "default"}
                      className={`${isMobile ? 'w-full' : 'flex-1'} ${isSmallMobile ? 'h-9 text-xs' : ''}`}
                    >
                      {shift.status === "open" ? "Sluiten" : "Openen"}
                    </Button>
                    <Button
                      onClick={() => deleteShift(shift.id)}
                      variant="outline"
                      size={isSmallMobile ? "sm" : "default"}
                      className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${
                        isMobile ? 'w-full' : 'w-auto'
                      } ${isSmallMobile ? 'h-9' : ''}`}
                    >
                      <Trash2 className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-2' : ''}`} />
                      {isMobile && 'Verwijderen'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
