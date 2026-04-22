import { Outlet, useLocation } from "react-router-dom";
import MerchantSidebar from "./MerchantSidebar";
import MerchantHeader from "./MerchantHeader";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MerchantOnboardingTour } from "../MerchantOnboardingTour";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import PendingApprovalBanner from "../PendingApprovalBanner";

const MerchantLayout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/merchant/admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // For admin routes, only check admin status
  const { isAdminUser, loading: adminLoading } = useAdmin();
  
  // For merchant routes, check merchant profile
  // Pass undefined for admin routes - the hook will handle it
  const { merchantProfile, loading: merchantLoading } = useMerchantAuth(undefined);

  const loading = isAdminRoute ? adminLoading : merchantLoading;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine the role to display
  const role = isAdminRoute ? (isAdminUser ? 'admin' : null) : merchantProfile?.role;

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Create a mock merchant profile for admin users
  const displayProfile = isAdminRoute && isAdminUser
    ? {
        id: 'admin',
        role: 'admin' as const,
        business_name: 'Admin Portal',
        business_email: '',
        verification_status: 'verified' as const,
        user_id: '',
        created_at: '',
        updated_at: ''
      }
    : merchantProfile;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <MerchantSidebar role={role} />
      </div>

      {/* Mobile Sidebar via Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 max-w-[85vw]">
          <MerchantSidebar role={role} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner />
        
        {/* Show pending banner if merchant is pending */}
        {!isAdminRoute && merchantProfile?.verification_status === 'pending' && (
          <div className="p-3 md:p-4 border-b">
            <PendingApprovalBanner profile={merchantProfile} />
          </div>
        )}
        
        {/* Header with integrated mobile menu button */}
        {displayProfile && (
          <MerchantHeader 
            merchantProfile={displayProfile} 
            onMenuToggle={() => setSidebarOpen(true)} 
          />
        )}

        <main className="flex-1 p-3 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Show onboarding tour only for verified merchants */}
      {!isAdminRoute && merchantProfile && merchantProfile.verification_status === 'verified' && (
        <MerchantOnboardingTour merchantProfileId={merchantProfile.id} />
      )}
    </div>
  );
};

export default MerchantLayout;
