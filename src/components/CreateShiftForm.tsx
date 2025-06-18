
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CreateShiftFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateShiftForm({ onClose, onSuccess }: CreateShiftFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    shift_date: "",
    start_time: "",
    end_time: "",
    min_people: "",
    max_people: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.shift_date || !formData.start_time || 
        !formData.end_time || !formData.min_people || !formData.max_people) {
      toast({
        title: "Velden vereist",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    const minPeople = parseInt(formData.min_people);
    const maxPeople = parseInt(formData.max_people);

    if (minPeople < 1 || maxPeople < 1) {
      toast({
        title: "Ongeldige waarden",
        description: "Minimum en maximum aantal personen moet minimaal 1 zijn.",
        variant: "destructive",
      });
      return;
    }

    if (minPeople > maxPeople) {
      toast({
        title: "Ongeldige waarden",
        description: "Minimum aantal personen kan niet groter zijn dan maximum.",
        variant: "destructive",
      });
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast({
        title: "Ongeldige tijden",
        description: "Starttijd moet voor eindtijd liggen.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bar_shifts")
        .insert({
          title: formData.title.trim(),
          shift_date: formData.shift_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          min_people: minPeople,
          max_people: maxPeople,
          remarks: formData.remarks.trim() || null,
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
              className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift_date">Datum *</Label>
            <Input
              id="shift_date"
              type="date"
              value={formData.shift_date}
              onChange={(e) => handleInputChange("shift_date", e.target.value)}
              required
              className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
            />
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
                className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
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
                className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_people">Min. personen *</Label>
              <Input
                id="min_people"
                type="number"
                min="1"
                value={formData.min_people}
                onChange={(e) => handleInputChange("min_people", e.target.value)}
                placeholder="2"
                required
                className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_people">Max. personen *</Label>
              <Input
                id="max_people"
                type="number"
                min="1"
                value={formData.max_people}
                onChange={(e) => handleInputChange("max_people", e.target.value)}
                placeholder="4"
                required
                className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Opmerkingen</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Bijv. Ervaring met kassasysteem gewenst"
              rows={3}
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
