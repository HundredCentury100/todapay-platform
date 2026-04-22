import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Car } from "lucide-react";

interface ProtectedDriverRouteProps {
  children: React.ReactNode;
}

const ProtectedDriverRoute = ({ children }: ProtectedDriverRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isDriver, setIsDriver] = useState(false);
  const [driverStatus, setDriverStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkDriverStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has driver role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "driver");

        if (!roles || roles.length === 0) {
          setIsDriver(false);
          setLoading(false);
          return;
        }

        // Check driver profile status
        const { data: driver } = await supabase
          .from("drivers")
          .select("id, status")
          .eq("user_id", user.id)
          .single();

        if (driver) {
          setIsDriver(true);
          setDriverStatus(driver.status);
        } else {
          setIsDriver(false);
        }
      } catch (error) {
        console.error("Error checking driver status:", error);
        setIsDriver(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkDriverStatus();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <Car className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground">Verifying driver access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isDriver) {
    return <Navigate to="/driver/register" replace />;
  }

  if (driverStatus === "pending") {
    return <Navigate to="/driver/register" replace />;
  }

  if (driverStatus === "suspended" || driverStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Car className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Account {driverStatus}</h2>
          <p className="text-muted-foreground mb-4">
            Your driver account has been {driverStatus}. Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedDriverRoute;
