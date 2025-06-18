
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminShifts from "@/components/AdminShifts";
import AdminRegistrations from "@/components/AdminRegistrations";
import CreateShiftForm from "@/components/CreateShiftForm";

export default function Admin() {
  const { adminData, isLoading, isAuthenticated, isAdmin, logout } = useAdminAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Security: Redirect non-admin users
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Geen toegang",
        description: "Je hebt geen admin rechten om deze pagina te bekijken.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated, isAdmin, toast]);

  const handleCreateShift = () => {
    if (!isAdmin) {
      toast({
        title: "Geen toegang",
        description: "Alleen admins kunnen bardiensten aanmaken.",
        variant: "destructive",
      });
      return;
    }
    setShowCreateForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c6be0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Admin verificatie...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Geen toegang</h1>
          <p className="text-gray-600 mb-4">
            Je hebt geen admin rechten om deze pagina te bekijken.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-[#0c6be0] hover:bg-[#0952b8]"
          >
            Terug naar hoofdpagina
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <header className="bg-white shadow-md border-b-4 border-[#0c6be0]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/cae344b2-9f96-4d55-97c3-b84fadef3473.png" 
                alt="v.v. Boskant Logo" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1 text-sm">
                  Welkom terug, {adminData?.name}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleCreateShift}
                className="bg-[#0c6be0] text-white hover:bg-[#0952b8] text-sm"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Bardienst
              </Button>
              <Button
                onClick={logout}
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
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
