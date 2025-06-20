
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminShifts from "@/components/AdminShifts";
import AdminRegistrations from "@/components/AdminRegistrations";
import AdminExport from "@/components/AdminExport";
import AdminNotifications from "@/components/AdminNotifications";
import CreateShiftForm from "@/components/CreateShiftForm";
import { useIsMobile, useIsSmallMobile } from "@/hooks/use-mobile";

export default function Admin() {
  const { adminData, isLoading, isAuthenticated, isAdmin, logout } = useAdminAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();

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
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-md border-b-4 border-[#0c6be0] sticky top-0 z-50">
        <div className={`max-w-7xl mx-auto ${isSmallMobile ? 'px-3 py-3' : 'px-4 py-4 sm:px-6'}`}>
          <div className="space-y-3">
            {/* Logo and Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/cae344b2-9f96-4d55-97c3-b84fadef3473.png" 
                  alt="v.v. Boskant Logo" 
                  className={`${isSmallMobile ? 'h-12' : 'h-14 sm:h-16'} w-auto flex-shrink-0`}
                />
                <div className="min-w-0 flex-1">
                  <h1 className={`${isSmallMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold text-gray-800 leading-tight`}>
                    Admin Dashboard
                  </h1>
                  <p className={`text-gray-600 ${isSmallMobile ? 'text-xs' : 'text-sm'} truncate`}>
                    Welkom terug, {adminData?.name}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleCreateShift}
                className={`bg-[#0c6be0] text-white hover:bg-[#0952b8] flex-1 ${isSmallMobile ? 'h-11 text-sm' : 'h-12'}`}
              >
                <Plus className={`${isSmallMobile ? 'h-4 w-4 mr-2' : 'h-5 w-5 mr-2'}`} />
                Nieuwe Bardienst
              </Button>
              <Button
                onClick={logout}
                variant="outline"
                className={`bg-white border-gray-300 text-gray-700 hover:bg-gray-50 ${isSmallMobile ? 'h-11 px-4' : 'h-12 px-6'}`}
              >
                <LogOut className={`${isSmallMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                {!isSmallMobile && <span className="ml-2">Uitloggen</span>}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto ${isSmallMobile ? 'px-3 py-4' : 'px-4 py-6 sm:px-6 sm:py-8'}`}>
        <Tabs defaultValue="shifts" className="space-y-4 sm:space-y-6">
          {/* Mobile-Optimized Tabs */}
          <div className="overflow-x-auto">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 min-w-[400px]' : 'grid-cols-4'} bg-blue-50 p-1 ${isSmallMobile ? 'h-auto' : ''}`}>
              <TabsTrigger 
                value="shifts" 
                className={`data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm ${
                  isSmallMobile ? 'text-xs py-2 px-2 h-auto whitespace-normal leading-tight' : 'text-sm'
                }`}
              >
                {isSmallMobile ? 'Bardiensten' : 'Bardiensten Beheren'}
              </TabsTrigger>
              <TabsTrigger 
                value="registrations" 
                className={`data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm ${
                  isSmallMobile ? 'text-xs py-2 px-2 h-auto whitespace-normal leading-tight' : 'text-sm'
                }`}
              >
                {isSmallMobile ? 'Inschrijvingen' : 'Inschrijvingen & Goedkeuringen'}
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className={`data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm ${
                  isSmallMobile ? 'text-xs py-2 px-2 h-auto whitespace-normal leading-tight' : 'text-sm'
                }`}
              >
                {isSmallMobile ? 'Herinneringen' : 'Email Herinneringen'}
              </TabsTrigger>
              <TabsTrigger 
                value="export" 
                className={`data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm ${
                  isSmallMobile ? 'text-xs py-2 px-2 h-auto whitespace-normal leading-tight' : 'text-sm'
                }`}
              >
                {isSmallMobile ? 'Export' : 'Registraties Exporteren'}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shifts" className="space-y-4 sm:space-y-6">
            <AdminShifts />
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4 sm:space-y-6">
            <AdminRegistrations />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 sm:space-y-6">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="export" className="space-y-4 sm:space-y-6">
            <AdminExport />
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
