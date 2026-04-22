import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdminUser, loading: adminLoading } = useAdmin();

  const loading = authLoading || adminLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not logged in - redirect to admin login
  if (!user) {
    return <Navigate to="/merchant/admin/auth" replace />;
  }

  // Logged in but not admin - redirect to admin login with message
  if (!isAdminUser) {
    return <Navigate to="/merchant/admin/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
