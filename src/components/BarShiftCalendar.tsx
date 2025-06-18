
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
      return "bg-gray-500";
    }
    if (shift.status === "full" || count >= shift.max_people) {
      return "bg-red-500";
    }
    return "bg-green-500";
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
      <CardHeader className="pb-4 bg-gradient-to-r from-[#0c6be0] to-[#0952b8] text-white rounded-t-lg">
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
      <CardContent className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-700 p-2 bg-gray-50 rounded">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 2)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={index}
                className={`min-h-[100px] sm:min-h-[120px] p-2 rounded-lg border-2 transition-all ${
                  isCurrentMonth 
                    ? isCurrentDay 
                      ? 'bg-blue-50 border-[#0c6be0]' 
                      : 'bg-white border-gray-200 hover:border-gray-300' 
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${
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
                        className={`text-xs p-2 rounded-md cursor-pointer border transition-all hover:shadow-md ${
                          canRegister(shift)
                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                            : isFull 
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => onShiftSelect(shift)}
                      >
                        <div className="font-semibold truncate mb-1" title={shift.title}>
                          {shift.title}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">
                            {shift.start_time.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="text-xs">{count}/{shift.max_people}</span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(shift)}`}></div>
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Beschikbaar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Vol/Gesloten</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Uitgeschakeld</span>
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
