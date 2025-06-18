
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Users, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
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

      // Fetch registration counts
      const counts: Record<string, number> = {};
      
      for (const shift of shiftsData || []) {
        const { data: countData } = await supabase
          .rpc("get_active_registration_count", { shift_uuid: shift.id });
        counts[shift.id] = countData || 0;
      }
      
      setRegistrationCounts(counts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.shift_date), day)
    );
  };

  const getStatusColor = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    
    if (shift.status === "closed") {
      return "bg-gray-400";
    }
    if (shift.status === "full" || count >= shift.max_people) {
      return "bg-red-400";
    }
    return "bg-green-400";
  };

  const canRegister = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    return shift.status === "open" && count < shift.max_people;
  };

  const days = getCalendarDays();
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
    <Card className="bg-white shadow-lg">
      <CardHeader className="pb-6 bg-gradient-to-r from-[#0c6be0] to-[#0952b8] text-white rounded-t-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl text-white flex items-center">
            <CalendarDays className="h-6 w-6 mr-3" />
            Bardiensten Kalender
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="text-white hover:bg-white/20 h-10 w-10 p-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-lg font-semibold px-4 min-w-[160px] text-center">
              {monthName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="text-white hover:bg-white/20 h-10 w-10 p-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-700 p-3 bg-gray-100 rounded">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={index}
                className={`min-h-[140px] p-2 rounded-lg border transition-all ${
                  isCurrentMonth 
                    ? isCurrentDay 
                      ? 'bg-blue-50 border-[#0c6be0] border-2' 
                      : 'bg-white border-gray-200 hover:border-gray-300' 
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className={`text-lg font-bold mb-3 text-center ${
                  isCurrentMonth 
                    ? isCurrentDay 
                      ? 'text-[#0c6be0]' 
                      : 'text-gray-900' 
                    : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayShifts.map(shift => {
                    const count = registrationCounts[shift.id] || 0;
                    const isFull = count >= shift.max_people || shift.status === "full";
                    
                    return (
                      <div
                        key={shift.id}
                        className={`text-xs p-2 rounded cursor-pointer transition-all hover:shadow-sm border ${
                          canRegister(shift)
                            ? 'bg-green-50 border-green-300 hover:bg-green-100'
                            : isFull 
                            ? 'bg-red-50 border-red-300'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                        onClick={() => onShiftSelect(shift)}
                      >
                        <div className="font-semibold text-gray-800 mb-1 text-[11px] leading-tight">
                          {shift.title}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-gray-600">
                            {shift.start_time.slice(0, 5)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-gray-600">{count}/{shift.max_people}</span>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(shift)}`}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-400"></div>
            <span>Beschikbaar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-400"></div>
            <span>Vol</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span>Gesloten</span>
          </div>
        </div>

        {shifts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Geen bardiensten gepland</p>
            <p className="text-sm">Voor {monthName.toLowerCase()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
