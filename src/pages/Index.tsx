
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, Users, MessageSquare, LogOut, EyeOff, Eye, Clock, MapPin, Star, Menu, User, LogIn } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Link } from "react-router-dom";
import RegistrationForm from "@/components/RegistrationForm";
import AdminLogin from "@/components/AdminLogin";
import UnsubscribeModal from "@/components/UnsubscribeModal";
import BarShiftCalendar from "@/components/BarShiftCalendar";
import { useIsMobile, useIsSmallMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

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
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, signOut, isAuthenticated } = useAuth();
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
      return <Badge variant="destructive" className={`bg-gray-500 text-white ${isSmallMobile ? 'text-xs px-2 py-1' : ''}`}>Gesloten</Badge>;
    }
    if (shift.status === "full" || count >= shift.max_people) {
      return <Badge variant="destructive" className={`bg-red-500 text-white ${isSmallMobile ? 'text-xs px-2 py-1' : ''}`}>Vol</Badge>;
    }
    return <Badge variant="secondary" className={`bg-green-100 text-green-800 border-green-300 ${isSmallMobile ? 'text-xs px-2 py-1' : ''}`}>
      {count}/{shift.max_people} beschikbaar
    </Badge>;
  };

  const canRegister = (shift: BarShift) => {
    const count = registrationCounts[shift.id] || 0;
    return shift.status === "open" && count < shift.max_people;
  };

  const getFilteredShifts = () => {
    if (!hideUnavailable) {
      return barShifts;
    }
    return barShifts.filter(shift => canRegister(shift));
  };

  const generateCalendarEvent = (shift: BarShift) => {
    const startDateTime = new Date(`${shift.shift_date}T${shift.start_time}`);
    const endDateTime = new Date(`${shift.shift_date}T${shift.end_time}`);
    
    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(shift.title);
    const details = encodeURIComponent(`Bardienst: ${shift.title}`);
    const location = encodeURIComponent("v.v. Boskant");
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateTime(startDateTime)}/${formatDateTime(endDateTime)}&details=${details}&location=${location}`;
    
    window.open(googleUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const filteredShifts = getFilteredShifts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Mobile-Optimized Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="relative">
                <img 
                  src="/lovable-uploads/cae344b2-9f96-4d55-97c3-b84fadef3473.png" 
                  alt="v.v. Boskant Logo" 
                  className={`${isSmallMobile ? 'h-10' : 'h-12 sm:h-14'} w-auto transition-transform hover:scale-105`}
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Bardiensten</h1>
                <p className="text-xs sm:text-sm text-gray-600">v.v. Boskant</p>
              </div>
              {isMobile && (
                <div className="block sm:hidden">
                  <h1 className="text-sm font-bold text-gray-900">Bardiensten</h1>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Desktop Action Buttons */}
            {!isMobile && (
              <div className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <>
                    <span className="text-sm text-gray-600">
                      Welkom, {user?.user_metadata?.full_name || user?.email}
                    </span>
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      size="sm"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Uitloggen
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button
                      variant="outline"
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      size="sm"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Inloggen
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowUnsubscribe(true)}
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Uitschrijven
                </Button>
                <Button
                  onClick={() => setShowAdminLogin(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  size="sm"
                >
                  Admin
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobile && mobileMenuOpen && (
            <div className="border-t border-blue-100 py-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-center text-sm text-gray-600 mb-3">
                    Welkom, {user?.user_metadata?.full_name || user?.email}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Uitloggen
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    size="sm"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Inloggen
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnsubscribe(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Uitschrijven
              </Button>
              <Button
                onClick={() => {
                  setShowAdminLogin(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="sm"
              >
                Admin
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className={`${isSmallMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-bold text-gray-900 mb-2 sm:mb-4`}>
            Welkom bij onze <span className="text-blue-600">Bardiensten</span>
          </h2>
          <p className={`${isSmallMobile ? 'text-base' : 'text-lg sm:text-xl'} text-gray-600 max-w-2xl mx-auto px-4`}>
            Schrijf je in voor een bardienst en help mee met het verenigingsleven
          </p>
        </div>

        <Tabs defaultValue="list" className="space-y-6 sm:space-y-8">
          <div className="flex justify-center">
            <TabsList className={`grid w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} grid-cols-2 bg-blue-50 p-1`}>
              <TabsTrigger 
                value="list" 
                className={`data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm ${isSmallMobile ? 'text-sm px-2' : ''}`}
              >
                <Users className={`${isSmallMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                Lijst
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className={`data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm ${isSmallMobile ? 'text-sm px-2' : ''}`}
              >
                <CalendarDays className={`${isSmallMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                Kalender
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="space-y-4 sm:space-y-6">
            {/* Filter Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className={`${isSmallMobile ? 'p-4' : 'p-6'}`}>
                <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      {hideUnavailable ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-gray-900 ${isSmallMobile ? 'text-sm' : ''}`}>Weergave Filter</h3>
                      <p className={`text-gray-600 ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                        Toon alleen beschikbare bardiensten
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={hideUnavailable}
                    onCheckedChange={setHideUnavailable}
                    className="data-[state=checked]:bg-blue-600 flex-shrink-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shifts Grid */}
            {filteredShifts.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className={`text-center ${isSmallMobile ? 'py-12' : 'py-16'}`}>
                  <div className={`${isSmallMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center`}>
                    <Users className={`${isSmallMobile ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
                  </div>
                  <h3 className={`${isSmallMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-600 mb-2`}>
                    {hideUnavailable ? "Geen beschikbare bardiensten" : "Geen bardiensten gepland"}
                  </h3>
                  <p className={`text-gray-500 max-w-md mx-auto px-4 ${isSmallMobile ? 'text-sm' : ''}`}>
                    {hideUnavailable 
                      ? "Er zijn momenteel geen boekbare bardiensten beschikbaar. Probeer later opnieuw." 
                      : "Er zijn momenteel geen bardiensten gepland. Kom later terug voor updates."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                {filteredShifts.map((shift) => {
                  const count = registrationCounts[shift.id] || 0;
                  const names = registrationNames[shift.id] || [];
                  const shiftDate = new Date(shift.shift_date);
                  const isFull = count >= shift.max_people || shift.status === "full";
                  const isAvailable = canRegister(shift);
                  const progressPercentage = Math.min((count / shift.max_people) * 100, 100);
                  
                  return (
                    <Card 
                      key={shift.id} 
                      className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-lg ${
                        isFull 
                          ? 'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-400' 
                          : 'bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-blue-400'
                      }`}
                    >
                      <CardHeader className={`${isSmallMobile ? 'pb-3' : 'pb-4'}`}>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className={`${isSmallMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate`}>
                              {shift.title}
                            </CardTitle>
                            <div className={`flex items-center mt-2 ${isMobile ? 'flex-col items-start space-y-1' : 'space-x-4'} ${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                              <div className="flex items-center">
                                <CalendarDays className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                                {format(shiftDate, "EEEE d MMM", { locale: nl })}
                              </div>
                              <div className="flex items-center">
                                <Clock className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                                {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(shift)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className={`flex justify-between ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                            <span className="text-gray-600">Inschrijvingen</span>
                            <span className="font-semibold text-gray-900">
                              {count}/{shift.max_people}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isFull ? 'bg-red-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Registered Names */}
                        {names.length > 0 && (
                          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-blue-100">
                            <div className="flex items-center mb-2">
                              <Star className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} text-blue-500 mr-2`} />
                              <h4 className={`font-semibold text-gray-900 ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>Ingeschreven</h4>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {names.map((name, index) => (
                                <span 
                                  key={index}
                                  className={`px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium ${isSmallMobile ? 'text-xs' : 'text-xs'}`}
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Remarks */}
                        {shift.remarks && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <MessageSquare className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} text-yellow-600 mr-2 mt-0.5 flex-shrink-0`} />
                              <p className={`text-yellow-800 font-medium ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>{shift.remarks}</p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className={`flex gap-2 sm:gap-3 pt-2 ${isMobile ? 'flex-col' : ''}`}>
                          <Button
                            onClick={() => setSelectedShift(shift)}
                            disabled={!isAvailable}
                            className={`${isMobile ? 'w-full' : 'flex-1'} font-semibold transition-all duration-200 ${isSmallMobile ? 'h-10 text-sm' : 'h-11'} ${
                              isAvailable 
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {isFull ? "Vol" : 
                             shift.status === "closed" ? "Gesloten" : 
                             "Inschrijven"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => generateCalendarEvent(shift)}
                            className={`${isMobile ? 'w-full' : ''} bg-white/80 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 ${isSmallMobile ? 'h-10' : 'h-11'} ${isMobile ? '' : 'w-12'}`}
                          >
                            <CalendarDays className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-2' : ''}`} />
                            {isMobile && 'Agenda'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <BarShiftCalendar onShiftSelect={setSelectedShift} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      {selectedShift && (
        <RegistrationForm
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {showAdminLogin && (
        <AdminLogin onClose={() => setShowAdminLogin(false)} />
      )}

      {showUnsubscribe && (
        <UnsubscribeModal onClose={() => setShowUnsubscribe(false)} />
      )}
    </div>
  );
}
