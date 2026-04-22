import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MerchantRole } from "@/types/merchant";

interface PostAuthRouterProps {
  children?: React.ReactNode;
  onRoutingComplete?: () => void;
}

// Maps merchant roles to their dashboard paths
const merchantDashboardPaths: Record<MerchantRole, string> = {
  bus_operator: "/merchant/bus-operator",
  event_organizer: "/merchant/event-organizer",
  venue_owner: "/merchant/venue-owner",
  property_owner: "/merchant/property-owner",
  airline_partner: "/merchant/airline",
  workspace_provider: "/merchant/workspace",
  car_rental_company: "/merchant/car-rental",
  transfer_provider: "/merchant/transfers",
  experience_host: "/merchant/experiences",
  travel_agent: "/merchant/agent",
  booking_agent: "/merchant/agent",
  admin: "/merchant/admin",
};

export const PostAuthRouter = ({ children, onRoutingComplete }: PostAuthRouterProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRouting, setIsRouting] = useState(true);

  useEffect(() => {
    const routeUser = async () => {
      if (authLoading || !user) {
        setIsRouting(false);
        return;
      }

      try {
        // Check for user roles - using raw query to avoid type issues
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        const userRoles = roles?.map((r) => r.role as string) || [];
        const isAdmin = userRoles.includes("admin");
        const isMerchant = userRoles.includes("merchant");
        const isDriver = userRoles.includes("driver");

        // Admin gets priority
        if (isAdmin) {
          navigate("/merchant/admin", { replace: true });
          onRoutingComplete?.();
          return;
        }

        // Check merchant profiles
        if (isMerchant) {
          const { data: profiles } = await supabase
            .from("merchant_profiles")
            .select("id, role")
            .eq("user_id", user.id);

          if (profiles && profiles.length === 1) {
            const path = merchantDashboardPaths[profiles[0].role as MerchantRole];
            if (path) {
              navigate(path, { replace: true });
              onRoutingComplete?.();
              return;
            }
          } else if (profiles && profiles.length > 1) {
            navigate("/merchant/portal", { replace: true });
            onRoutingComplete?.();
            return;
          }
        }

        // Driver routing
        if (isDriver) {
          const { data: driverProfile } = await supabase
            .from("drivers")
            .select("id, status")
            .eq("user_id", user.id)
            .single();

          if (driverProfile) {
            if (driverProfile.status === "pending") {
              navigate("/driver/register", { replace: true });
            } else {
              navigate("/driver/profile", { replace: true });
            }
            onRoutingComplete?.();
            return;
          }
        }

        // Default: consumer home
        navigate("/", { replace: true });
        onRoutingComplete?.();
      } catch (error) {
        console.error("Error routing user:", error);
        navigate("/", { replace: true });
        onRoutingComplete?.();
      } finally {
        setIsRouting(false);
      }
    };

    routeUser();
  }, [user, authLoading, navigate, onRoutingComplete]);

  if (isRouting || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PostAuthRouter;
