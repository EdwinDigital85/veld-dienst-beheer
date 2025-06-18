
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface UnsubscribeModalProps {
  onClose: () => void;
}

export default function UnsubscribeModal({ onClose }: UnsubscribeModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email vereist",
        description: "Vul je emailadres in om je uit te schrijven.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("Looking for registrations for email:", email.toLowerCase());
      
      // Find active registrations for this email
      const { data: registrations, error: fetchError } = await supabase
        .from("registrations")
        .select(`
          id,
          name,
          bar_shifts (
            title,
            shift_date,
            start_time
          )
        `)
        .eq("email", email.toLowerCase())
        .eq("status", "active");

      if (fetchError) {
        console.error("Error fetching registrations:", fetchError);
        throw fetchError;
      }

      console.log("Found registrations:", registrations);

      if (!registrations || registrations.length === 0) {
        toast({
          title: "Geen inschrijvingen gevonden",
          description: "Er zijn geen actieve inschrijvingen gevonden voor dit emailadres.",
          variant: "destructive",
        });
        return;
      }

      console.log("Updating registrations to pending_removal for:", registrations.map(r => r.id));

      // Update all active registrations to pending_removal status
      const { error: updateError } = await supabase
        .from("registrations")
        .update({ 
          status: "pending_removal",
          updated_at: new Date().toISOString()
        })
        .eq("email", email.toLowerCase())
        .eq("status", "active");

      if (updateError) {
        console.error("Error updating registrations:", updateError);
        throw updateError;
      }

      console.log("Successfully updated registrations to pending_removal");

      toast({
        title: "Uitschrijfverzoek verzonden",
        description: `Je uitschrijfverzoek voor ${registrations.length} bardienst(en) is verzonden naar de admin voor goedkeuring.`,
      });

      onClose();
    } catch (error) {
      console.error("Error requesting unsubscribe:", error);
      toast({
        title: "Fout bij uitschrijven",
        description: "Er is een fout opgetreden. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0c6be0]">Uitschrijven voor bardienst</DialogTitle>
          <DialogDescription>
            Vul je emailadres in om een uitschrijfverzoek in te dienen.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <p className="text-orange-800 font-medium">Let op:</p>
              <p className="text-orange-700 text-sm">
                Je uitschrijfverzoek moet door de admin goedgekeurd worden voordat je definitief uitgeschreven bent.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleUnsubscribe} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Emailadres *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="je@email.nl"
              required
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
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Bezig..." : "Uitschrijfverzoek indienen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
