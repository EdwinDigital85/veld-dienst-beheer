
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  validateShiftTitle, 
  validateShiftTime, 
  validateShiftDate, 
  validatePeopleCount,
  sanitizeInput 
} from "@/utils/inputValidation";

interface CreateShiftFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateShiftForm({ onClose, onSuccess }: CreateShiftFormProps) {
  const { isAdmin, isLoading } = useAdminAuth();
  const [formData, setFormData] = useState({
    title: "",
    shift_date: "",
    start_time: "",
    end_time: "",
    people_count: "1",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Security check: Only allow admins to access this form
  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c6be0]"></div>
            <span className="ml-3">Verificatie...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isAdmin) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600">Geen toegang</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-600 mb-4">
              Je hebt geen admin rechten om bardiensten aan te maken.
            </p>
            <Button onClick={onClose} className="w-full">
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!validateShiftTitle(formData.title)) {
      newErrors.title = "Titel moet tussen 3 en 100 karakters zijn";
    }

    // Validate date
    if (!validateShiftDate(formData.shift_date)) {
      newErrors.shift_date = "Datum moet in de toekomst liggen";
    }

    // Validate times
    if (!validateShiftTime(formData.start_time, formData.end_time)) {
      newErrors.time = "Starttijd moet voor eindtijd liggen";
    }

    // Validate people count
    const peopleCount = parseInt(formData.people_count);
    
    if (isNaN(peopleCount) || peopleCount < 1 || peopleCount > 50) {
      newErrors.people = "Aantal personen moet tussen 1 en 50 zijn";
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
      const { error } = await supabase
        .from("bar_shifts")
        .insert({
          title: sanitizeInput(formData.title),
          shift_date: formData.shift_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          min_people: 1,
          max_people: parseInt(formData.people_count),
          remarks: formData.remarks.trim() ? sanitizeInput(formData.remarks) : null,
        });

      if (error) throw error;

      toast({
        title: "Bardienst aangemaakt!",
        description: "De nieuwe bardienst is succesvol aangemaakt.",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating shift:", error);
      toast({
        title: "Fout bij aanmaken",
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0c6be0]">Nieuwe Bardienst Aanmaken</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Bijv. Bardienst Thuiswedstrijd"
              required
              maxLength={100}
              className={`focus:border-[#0c6be0] focus:ring-[#0c6be0] ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift_date">Datum *</Label>
            <Input
              id="shift_date"
              type="date"
              value={formData.shift_date}
              onChange={(e) => handleInputChange("shift_date", e.target.value)}
              required
              className={`focus:border-[#0c6be0] focus:ring-[#0c6be0] ${errors.shift_date ? 'border-red-500' : ''}`}
            />
            {errors.shift_date && <p className="text-sm text-red-500">{errors.shift_date}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Starttijd *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange("start_time", e.target.value)}
                required
                className={`focus:border-[#0c6be0] focus:ring-[#0c6be0] ${errors.time ? 'border-red-500' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Eindtijd *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange("end_time", e.target.value)}
                required
                className={`focus:border-[#0c6be0] focus:ring-[#0c6be0] ${errors.time ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.time && <p className="text-sm text-red-500 col-span-2">{errors.time}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="people_count">Aantal personen *</Label>
            <Input
              id="people_count"
              type="number"
              min="1"
              max="50"
              value={formData.people_count}
              onChange={(e) => handleInputChange("people_count", e.target.value)}
              placeholder="1"
              required
              className={`focus:border-[#0c6be0] focus:ring-[#0c6be0] ${errors.people ? 'border-red-500' : ''}`}
            />
            {errors.people && <p className="text-sm text-red-500">{errors.people}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Opmerkingen</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Bijv. Ervaring met kassasysteem gewenst"
              rows={3}
              maxLength={500}
              className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
            />
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
              {loading ? "Bezig..." : "Aanmaken"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
