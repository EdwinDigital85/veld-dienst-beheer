
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { nl } from "date-fns/locale";

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

interface BarShiftCalendarProps {
  onShiftSelect: (shift: BarShift) => void;
}

export default function BarShiftCalendar({ onShiftSelect }: BarShiftCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<BarShift[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [registrationNames, setRegistrationNames] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, [currentDate]);

  const fetchShifts = async () => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data: shiftsData, error } = await supabase
        .from("bar_shifts")
        .select("*")
        .gte("shift_date", format(monthStart, "yyyy-MM-dd"))
        .lte("shift_date", format(monthEnd, "yyyy-MM-dd"))
        .order("shift_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      setShifts(shiftsData || []);

      // Fetch registration counts and names
      const counts: Record<string, number> = {};
      const names: Record<string, string[]> = {};
      
      for (const shift of shiftsData || []) {
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
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.shift_date), day)
    );
  };

  const getStatusBadge = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    
    if (shift.status === "closed") {
      return <Badge variant="destructive" className="text-xs">Gesloten</Badge>;
    }
    if (shift.status === "full" || count >= shift.max_people) {
      return <Badge variant="destructive" className="text-xs">Vol ({count}/{shift.max_people})</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{count}/{shift.max_people}</Badge>;
  };

  const canRegister = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    return shift.status === "open" && count < shift.max_people;
  };

  const days = getDaysInMonth();
  const monthName = format(currentDate, "MMMM yyyy", { locale: nl });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c6be0] mx-auto"></div>
        <p className="mt-4 text-gray-600">Kalender laden...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg sm:text-xl text-gray-800 flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-[#0c6be0]" />
            Bardiensten Kalender
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="px-2 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-base sm:text-lg font-semibold min-w-[140px] sm:min-w-[160px] text-center">
              {monthName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="px-2 sm:px-3"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 p-1 sm:p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div
                key={index}
                className={`min-h-[80px] sm:min-h-[120px] p-1 border rounded ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className={`text-xs sm:text-sm ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1 mt-1">
                  {dayShifts.map(shift => {
                    const count = registrationCounts[shift.id] || 0;
                    const names = registrationNames[shift.id] || [];
                    const isFull = count >= shift.max_people || shift.status === "full";
                    
                    return (
                      <div
                        key={shift.id}
                        className={`text-xs p-1 sm:p-2 rounded cursor-pointer border transition-colors ${
                          canRegister(shift)
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                            : isFull 
                            ? 'bg-red-50 border-red-200 opacity-75'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => onShiftSelect(shift)}
                      >
                        <div className="font-medium truncate mb-1 text-xs" title={shift.title}>
                          {shift.title}
                        </div>
                        <div className="text-gray-600 mb-1 text-xs">
                          {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="h-2 w-2 sm:h-3 sm:w-3" />
                          {getStatusBadge(shift)}
                        </div>
                        {names.length > 0 && (
                          <div className="text-xs text-gray-500 truncate hidden sm:block" title={names.join(', ')}>
                            {names.join(', ')}
                          </div>
                        )}
                        {!canRegister(shift) && isFull && (
                          <div className="text-xs text-red-600 font-medium mt-1 hidden sm:block">
                            Niet beschikbaar
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {shifts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm sm:text-base">Geen bardiensten gepland voor {monthName.toLowerCase()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
