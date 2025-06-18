
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { validateEmail, sanitizeInput } from "@/utils/inputValidation";

interface AdminLoginProps {
  onClose: () => void;
}

export default function AdminLogin({ onClose }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateEmail(email)) {
      newErrors.email = "Vul een geldig emailadres in";
    }

    if (!password.trim() || password.length < 6) {
      newErrors.password = "Wachtwoord moet minimaal 6 karakters zijn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizeInput(email.trim()),
        password: password,
      });

      if (error) throw error;

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id, name")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        toast({
          title: "Geen toegang",
          description: "Je hebt geen admin rechten.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Welkom terug!",
        description: `Ingelogd als ${adminData.name}`,
      });

      navigate("/admin");
      onClose();
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Er is een fout opgetreden.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Onjuist emailadres of wachtwoord.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Bevestig eerst je emailadres.";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Te veel inlogpogingen. Probeer het later opnieuw.";
      }
      
      toast({
        title: "Inloggen mislukt",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0c6be0]">Admin Login</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="admin@voetbalclub.nl"
              required
              maxLength={100}
              className={`focus:border-[#0c6be0] focus:ring-[#0c6be0] ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              maxLength={128}
              className={`focus:border-[#0c6be0] focus:ring-[#0c6be0] ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
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
              {loading ? "Bezig..." : "Inloggen"}
            </Button>
          </div>
        </form>

        <div className="text-sm text-gray-500 text-center space-y-2">
          <p><strong>Test account:</strong> admin@voetbalclub.nl</p>
          <p className="text-xs">
            Je moet eerst een admin account aanmaken in Supabase Auth:<br/>
            1. Ga naar Supabase Dashboard → Authentication → Users<br/>
            2. Klik "Add user" en maak een account aan<br/>
            3. Gebruik hetzelfde email adres als in de admin_users tabel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
