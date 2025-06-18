
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminShifts from "@/components/AdminShifts";
import AdminRegistrations from "@/components/AdminRegistrations";
import CreateShiftForm from "@/components/CreateShiftForm";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }

      setUser(session.user);

      // Check if user is admin - try to get admin data
      try {
        const { data: adminData, error } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (error) {
          console.error("Admin check error:", error);
          toast({
            title: "Geen toegang",
            description: "Je hebt geen admin rechten of er is een probleem met de database.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (!adminData) {
          toast({
            title: "Geen toegang",
            description: "Je hebt geen admin rechten.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setAdminData(adminData);
      } catch (error) {
        console.error("Admin verification error:", error);
        toast({
          title: "Fout bij verificatie",
          description: "Er is een probleem opgetreden bij het controleren van admin rechten.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c6be0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0c6be0] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1 text-sm">
                Welkom terug, {adminData?.name}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-white text-[#0c6be0] hover:bg-gray-100 text-sm"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Bardienst
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-[#0c6be0] text-sm"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="shifts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shifts">Bardiensten Beheren</TabsTrigger>
            <TabsTrigger value="registrations">Inschrijvingen & Goedkeuringen</TabsTrigger>
          </TabsList>

          <TabsContent value="shifts" className="space-y-6">
            <AdminShifts />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-6">
            <AdminRegistrations />
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Shift Modal */}
      {showCreateForm && (
        <CreateShiftForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
