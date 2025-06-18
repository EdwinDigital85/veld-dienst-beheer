
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AdminLoginProps {
  onClose: () => void;
}

export default function AdminLogin({ onClose }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Velden vereist",
        description: "Vul email en wachtwoord in.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id, name")
        .eq("email", email.trim())
        .maybeSingle();

      if (adminError) throw adminError;

      if (!adminData) {
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
      toast({
        title: "Inloggen mislukt",
        description: error.message || "Controleer je inloggegevens.",
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
          <DialogTitle className="text-[#0c6be0]">Admin Login</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@voetbalclub.nl"
              required
              className="focus:border-[#0c6be0] focus:ring-[#0c6be0]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              className="flex-1 bg-[#0c6be0] hover:bg-[#0952b8]"
            >
              {loading ? "Bezig..." : "Inloggen"}
            </Button>
          </div>
        </form>

        <div className="text-sm text-gray-500 text-center">
          <p>Test account: admin@voetbalclub.nl</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
