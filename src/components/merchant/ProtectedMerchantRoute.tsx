import { Navigate } from "react-router-dom";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { MerchantRole } from "@/types/merchant";

interface ProtectedMerchantRouteProps {
  children: React.ReactNode;
  requiredRole?: MerchantRole;
}

const ProtectedMerchantRoute = ({ children, requiredRole }: ProtectedMerchantRouteProps) => {
  const { loading, hasAccess, merchantProfile } = useMerchantAuth(requiredRole);
  const { isAdminUser } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admins always have access to all merchant routes
  if (isAdminUser) {
    return <>{children}</>;
  }

  // Check if merchant has access
  if (!hasAccess) {
    return <Navigate to="/merchant/portal" replace />;
  }

  // Check if merchant/agent is verified (allow pending to see limited dashboard)
  if (merchantProfile && !['verified', 'pending'].includes(merchantProfile.verification_status)) {
    return <Navigate to="/merchant/portal" replace />;
  }

  // For agent routes without specific role requirement, accept any agent role
  if (!requiredRole && merchantProfile && (merchantProfile.role === 'travel_agent' || merchantProfile.role === 'booking_agent')) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedMerchantRoute;
