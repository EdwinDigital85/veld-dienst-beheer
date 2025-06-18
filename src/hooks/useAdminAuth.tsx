
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export const useAdminAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setAdminData(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        navigate("/");
      } else if (session) {
        verifyAdminStatus(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        return;
      }

      await verifyAdminStatus(session.user);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsLoading(false);
    }
  };

  const verifyAdminStatus = async (user: any) => {
    setUser(user);
    setIsAuthenticated(true);
    
    try {
      const { data: adminData, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error || !adminData) {
        console.error("Admin verification failed:", error);
        setIsAdmin(false);
        setAdminData(null);
      } else {
        setIsAdmin(true);
        setAdminData(adminData);
      }
    } catch (error) {
      console.error("Admin verification error:", error);
      setIsAdmin(false);
      setAdminData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    adminData,
    isLoading,
    isAuthenticated,
    isAdmin,
    logout,
    verifyAdminStatus
  };
};
