
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, Users } from "lucide-react";
import { format } from "date-fns";
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
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({
        title: "Velden vereist",
        description: "Vul alle velden in om je in te schrijven.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Ongeldig emailadres",
        description: "Vul een geldig emailadres in.",
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

      // Register the user
      const { error } = await supabase
        .from("registrations")
        .insert({
          shift_id: shift.id,
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim(),
        });

      if (error) throw error;

      toast({
        title: "Inschrijving succesvol!",
        description: "Je bent succesvol ingeschreven voor de bardienst.",
      });

      onSuccess();
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
  };

  const shiftDate = new Date(shift.shift_date);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0c6be0]">Inschrijven voor bardienst</DialogTitle>
          <DialogDescription>
            Vul je gegevens in om je in te schrijven voor deze bardienst.
          </DialogDescription>
        </DialogHeader>

        {/* Shift Details */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-800">{shift.title}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 mr-2" />
            {format(shiftDate, "EEEE d MMMM yyyy", { locale: nl })}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {shift.start_time} - {shift.end_time}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            Minimaal {shift.min_people} personen, maximaal {shift.max_people}
          </div>
          {shift.remarks && (
            <p className="text-sm text-gray-600 italic">{shift.remarks}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Volledige naam *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Je voor- en achternaam"
              required
              className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Emailadres *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="je@email.nl"
              required
              className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoonnummer *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="06-12345678"
              required
              className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Let op:</strong> Eenmaal ingeschreven kun je jezelf alleen uitschrijven na goedkeuring van de admin.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#0c6be0] hover:bg-[#0952b8]"
            >
              {loading ? "Bezig..." : "Inschrijven"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
