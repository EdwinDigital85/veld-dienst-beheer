
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Users, Clock, Sparkles } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, isPast, isThisWeek } from "date-fns";
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
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
    return "bg-emerald-400";
  };

  const canRegister = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    return shift.status === "open" && count < shift.max_people;
  };

  const days = getCalendarDays();
  const monthName = format(currentDate, "MMMM yyyy", { locale: nl });

  if (loading) {
    return (
      <Card className="bg-white shadow-xl border-0">
        <CardContent className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-24 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl text-white flex items-center">
              <div className="p-2 bg-white/20 rounded-lg mr-3">
                <CalendarDays className="h-6 w-6" />
              </div>
              Bardiensten Kalender
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="text-white hover:bg-white/20 h-10 w-10 p-0 transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-lg font-semibold px-6 min-w-[180px] text-center capitalize">
                {monthName}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="text-white hover:bg-white/20 h-10 w-10 p-0 transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
              <div key={day} className={`text-center text-sm font-bold py-3 rounded-lg ${
                index >= 5 ? 'text-blue-600 bg-blue-50' : 'text-gray-700 bg-gray-50'
              }`}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayShifts = getShiftsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isPastDay = isPast(day) && !isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isCurrentWeek = isThisWeek(day);
              
              return (
                <div
                  key={index}
                  className={`min-h-[160px] p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                    isCurrentMonth 
                      ? isCurrentDay 
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-md' 
                        : isCurrentWeek
                        ? 'bg-gradient-to-br from-blue-25 to-white border-blue-200 hover:border-blue-300'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md' 
                      : 'bg-gray-50 border-gray-100 opacity-60'
                  } ${isWeekend && isCurrentMonth ? 'bg-gradient-to-br from-indigo-25 to-purple-25' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className={`text-lg font-bold mb-3 text-center ${
                    isCurrentMonth 
                      ? isCurrentDay 
                        ? 'text-blue-700' 
                        : isPastDay
                        ? 'text-gray-500'
                        : 'text-gray-900' 
                      : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                    {isCurrentDay && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto mt-1"></div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayShifts.slice(0, 2).map(shift => {
                      const count = registrationCounts[shift.id] || 0;
                      const isFull = count >= shift.max_people || shift.status === "full";
                      
                      return (
                        <div
                          key={shift.id}
                          className={`text-xs p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                            canRegister(shift)
                              ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm'
                              : isFull 
                              ? 'bg-red-50 border-red-200 opacity-75'
                              : 'bg-gray-50 border-gray-200 opacity-75'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onShiftSelect(shift);
                          }}
                        >
                          <div className="font-semibold text-gray-800 mb-1 text-[11px] leading-tight truncate">
                            {shift.title}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-[10px] text-gray-600">
                              <Clock className="h-3 w-3 mr-1" />
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
                    {dayShifts.length > 2 && (
                      <div className="text-xs text-center text-blue-600 font-semibold bg-blue-50 rounded-lg py-1">
                        +{dayShifts.length - 2} meer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Beschikbaar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-400 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Vol</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Gesloten</span>
              </div>
            </div>
          </div>

          {shifts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <CalendarDays className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">Geen bardiensten gepland</h3>
              <p className="text-gray-500">Voor {monthName.toLowerCase()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDay && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Sparkles className="h-5 w-5 mr-2" />
              {format(selectedDay, "EEEE d MMMM yyyy", { locale: nl })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getShiftsForDay(selectedDay).length === 0 ? (
              <p className="text-gray-600">Geen bardiensten gepland voor deze dag.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {getShiftsForDay(selectedDay).map(shift => {
                  const count = registrationCounts[shift.id] || 0;
                  const isFull = count >= shift.max_people || shift.status === "full";
                  
                  return (
                    <div
                      key={shift.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        canRegister(shift)
                          ? 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-md'
                          : 'bg-gray-50 border-gray-200 opacity-75'
                      }`}
                      onClick={() => onShiftSelect(shift)}
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{shift.title}</h4>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {count}/{shift.max_people}
                        </div>
                      </div>
                      {shift.remarks && (
                        <p className="text-xs text-blue-700 mt-2 italic">{shift.remarks}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
