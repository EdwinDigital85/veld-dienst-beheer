
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Users, CheckCircle, AlertCircle, Mail, Phone, User, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { validateEmail, validatePhone, validateName, sanitizeInput } from "@/utils/inputValidation";
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

interface RegistrationFormProps {
  shift: BarShift;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationForm({ shift, onClose, onSuccess }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateName(formData.name)) {
      newErrors.name = "Naam moet tussen 2-50 karakters zijn en alleen letters bevatten";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Vul een geldig emailadres in";
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Vul een geldig Nederlands telefoonnummer in";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validatie fouten",
        description: "Controleer de ingevoerde gegevens",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if shift is still available
      const { data: isFullData } = await supabase
        .rpc("is_shift_full", { shift_uuid: shift.id });

      if (isFullData) {
        toast({
          title: "Bardienst vol",
          description: "Deze bardienst is inmiddels vol. Probeer een andere datum.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if user is already registered
      const { data: existingRegistration } = await supabase
        .from("registrations")
        .select("id")
        .eq("shift_id", shift.id)
        .eq("email", formData.email.toLowerCase())
        .eq("status", "active")
        .maybeSingle();

      if (existingRegistration) {
        toast({
          title: "Al ingeschreven",
          description: "Je bent al ingeschreven voor deze bardienst.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Register the user with sanitized input
      const { error } = await supabase
        .from("registrations")
        .insert({
          shift_id: shift.id,
          name: sanitizeInput(formData.name),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.replace(/[\s-]/g, ''), // Clean phone format
        });

      if (error) throw error;

      toast({
        title: "Inschrijving succesvol!",
        description: "Je bent succesvol ingeschreven voor de bardienst.",
      });

      setShowSuccess(true);
    } catch (error) {
      console.error("Error registering:", error);
      toast({
        title: "Fout bij inschrijven",
        description: "Er is een fout opgetreden. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const generateCalendarEvent = () => {
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

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  const shiftDate = new Date(shift.shift_date);

  if (showSuccess) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className={`${isMobile ? 'sm:max-w-[95vw] max-w-[90vw]' : 'sm:max-w-lg'} bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 ${isSmallMobile ? 'p-4' : ''}`}>
          <DialogHeader className="text-center">
            <div className={`mx-auto ${isSmallMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-green-100 rounded-full flex items-center justify-center mb-4`}>
              <CheckCircle className={`${isSmallMobile ? 'h-6 w-6' : 'h-8 w-8'} text-green-600`} />
            </div>
            <DialogTitle className={`${isSmallMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-700`}>Inschrijving succesvol!</DialogTitle>
            <DialogDescription className={`text-green-600 ${isSmallMobile ? 'text-sm' : ''}`}>
              Je bent succesvol ingeschreven voor de bardienst.
            </DialogDescription>
          </DialogHeader>

          <div className={`bg-white rounded-xl ${isSmallMobile ? 'p-4' : 'p-6'} border border-green-200 shadow-sm space-y-3 sm:space-y-4`}>
            <h3 className={`font-bold text-gray-900 ${isSmallMobile ? 'text-base' : 'text-lg'}`}>{shift.title}</h3>
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
              <div className="flex items-center text-gray-600">
                <CalendarDays className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
                {format(shiftDate, "EEEE d MMMM", { locale: nl })}
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
                {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
                v.v. Boskant
              </div>
              <div className="flex items-center text-gray-600">
                <Users className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
                Bardienst
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className={`bg-blue-50 border border-blue-200 rounded-xl ${isSmallMobile ? 'p-3' : 'p-4'}`}>
              <h4 className={`font-semibold text-blue-900 ${isSmallMobile ? 'mb-1' : 'mb-2'} flex items-center ${isSmallMobile ? 'text-sm' : ''}`}>
                <CalendarDays className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                Toevoegen aan agenda
              </h4>
              <p className={`text-blue-700 ${isSmallMobile ? 'mb-2 text-xs' : 'text-sm mb-3'}`}>
                Vergeet je bardienst niet! Voeg hem toe aan je agenda.
              </p>
              <Button
                onClick={generateCalendarEvent}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white ${isSmallMobile ? 'h-9 text-sm' : ''}`}
              >
                <CalendarDays className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                Google Agenda
              </Button>
            </div>

            <div className={`bg-yellow-50 border border-yellow-200 rounded-xl ${isSmallMobile ? 'p-3' : 'p-4'}`}>
              <h4 className={`font-semibold text-yellow-900 ${isSmallMobile ? 'mb-1' : 'mb-2'} flex items-center ${isSmallMobile ? 'text-sm' : ''}`}>
                <Mail className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                Email herinneringen
              </h4>
              <p className={`text-yellow-800 ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                Je ontvangt automatisch een herinnering een week en drie dagen voor de bardienst.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleFinish} 
            className={`w-full bg-green-600 hover:bg-green-700 text-white ${isSmallMobile ? 'h-10 text-sm' : ''}`}
          >
            Sluiten
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'sm:max-w-[95vw] max-w-[90vw]' : 'sm:max-w-lg'} bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ${isSmallMobile ? 'p-4' : ''} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader className="text-center">
          <div className={`mx-auto ${isSmallMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-blue-100 rounde d-full flex items-center justify-center mb-4`}>
            <Users className={`${isSmallMobile ? 'h-6 w-6' : 'h-8 w-8'} text-blue-600`} />
          </div>
          <DialogTitle className={`${isSmallMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-700`}>Inschrijven voor bardienst</DialogTitle>
          <DialogDescription className={`text-blue-600 ${isSmallMobile ? 'text-sm' : ''}`}>
            Vul je gegevens in om je in te schrijven.
          </DialogDescription>
        </DialogHeader>

        {/* Shift Details */}
        <div className={`bg-white rounded-xl ${isSmallMobile ? 'p-4' : 'p-6'} border border-blue-200 shadow-sm space-y-3 sm:space-y-4`}>
          <h3 className={`font-bold text-gray-900 ${isSmallMobile ? 'text-base' : 'text-lg'}`}>{shift.title}</h3>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center text-gray-600">
              <CalendarDays className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
              {format(shiftDate, "EEEE d MMMM", { locale: nl })}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
              {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
            </div>
          </div>
          {shift.remarks && (
            <div className={`bg-yellow-50 border border-yellow-200 rounded-lg ${isSmallMobile ? 'p-2' : 'p-3'}`}>
              <p className={`text-yellow-800 font-medium flex items-start ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                <AlertCircle className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 mt-0.5 flex-shrink-0`} />
                {shift.remarks}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={`text-gray-700 font-semibold flex items-center ${isSmallMobile ? 'text-sm' : ''}`}>
                <User className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
                Volledige naam *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Je voor- en achternaam"
                required
                maxLength={50}
                className={`${isSmallMobile ? 'h-10 text-sm' : 'h-12 text-base'} border-2 transition-all duration-200 ${
                  errors.name 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : 'border-blue-200 focus:border-blue-500 bg-white'
                }`}
              />
              {errors.name && (
                <p className={`text-red-600 flex items-center ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                  <AlertCircle className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className={`text-gray-700 font-semibold flex items-center ${isSmallMobile ? 'text-sm' : ''}`}>
                <Mail className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
                Emailadres *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="je@email.nl"
                required
                maxLength={100}
                className={`${isSmallMobile ? 'h-10 text-sm' : 'h-12 text-base'} border-2 transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : 'border-blue-200 focus:border-blue-500 bg-white'
                }`}
              />
              {errors.email && (
                <p className={`text-red-600 flex items-center ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                  <AlertCircle className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className={`text-gray-700 font-semibold flex items-center ${isSmallMobile ? 'text-sm' : ''}`}>
                <Phone className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2 text-blue-500`} />
                Telefoonnummer *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="06-12345678"
                required
                maxLength={15}
                className={`${isSmallMobile ? 'h-10 text-sm' : 'h-12 text-base'} border-2 transition-all duration-200 ${
                  errors.phone 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : 'border-blue-200 focus:border-blue-500 bg-white'
                }`}
              />
              {errors.phone && (
                <p className={`text-red-600 flex items-center ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
                  <AlertCircle className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className={`bg-yellow-50 border border-yellow-200 rounded-xl ${isSmallMobile ? 'p-3' : 'p-4'}`}>
            <h4 className={`font-semibold text-yellow-900 ${isSmallMobile ? 'mb-1' : 'mb-2'} flex items-center ${isSmallMobile ? 'text-sm' : ''}`}>
              <AlertCircle className={`${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
              Belangrijke informatie
            </h4>
            <ul className={`text-yellow-800 space-y-1 ${isSmallMobile ? 'text-xs' : 'text-sm'}`}>
              <li>• Eenmaal ingeschreven kun je alleen uitschrijven na admin goedkeuring</li>
              <li>• Je ontvangt automatische email herinneringen</li>
              <li>• Zorg dat je op tijd aanwezig bent</li>
            </ul>
          </div>

          <div className={`flex gap-2 sm:gap-3 pt-2 sm:pt-4 ${isMobile ? 'flex-col' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`${isMobile ? 'w-full' : 'flex-1'} ${isSmallMobile ? 'h-10' : 'h-12'} border-2 border-gray-300 text-gray-700 hover:bg-gray-50 ${isSmallMobile ? 'text-sm' : ''}`}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`${isMobile ? 'w-full' : 'flex-1'} ${isSmallMobile ? 'h-10' : 'h-12'} bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${isSmallMobile ? 'text-sm' : ''}`}
            >
              {loading ? (
                <>
                  <div className={`animate-spin rounded-full ${isSmallMobile ? 'h-3 w-3' : 'h-4 w-4'} border-2 border-white border-t-transparent mr-2`}></div>
                  Bezig...
                </>
              ) : (
                "Inschrijven"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
