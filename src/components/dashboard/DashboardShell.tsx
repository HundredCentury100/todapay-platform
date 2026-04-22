import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardMobileNav } from "./DashboardMobileNav";
import { useDashboardMode, DashboardMode } from "@/hooks/useDashboardMode";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/loading-states";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardShellProps {
  mode?: DashboardMode;
}

export const DashboardShell = ({ mode: propMode }: DashboardShellProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const {
    currentMode,
    availableModes,
    switchMode,
    hasMultipleModes,
    isLoading: rolesLoading,
    merchantRole,
  } = useDashboardMode();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Use prop mode if provided, otherwise use detected mode
  const activeMode = propMode || currentMode;

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) {
      setIsSidebarCollapsed(saved === "true");
    }
  }, []);

  // Save collapsed state
  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      const newState = !isSidebarCollapsed;
      setIsSidebarCollapsed(newState);
      localStorage.setItem("sidebar_collapsed", String(newState));
    }
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Redirect if not authenticated with returnTo
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { returnTo: location.pathname } });
    }
  }, [authLoading, user, navigate, location.pathname]);

  // Loading state
  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageLoader message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar
          mode={activeMode}
          isCollapsed={isSidebarCollapsed}
          merchantRole={merchantRole}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-card border-r shadow-md animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <DashboardSidebar
              mode={activeMode}
              isCollapsed={false}
              merchantRole={merchantRole}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          currentMode={activeMode}
          availableModes={availableModes}
          onSwitchMode={(mode) => {
            switchMode(mode);
            const modeInfo = availableModes.find(m => m.mode === mode);
            if (modeInfo) {
              navigate(modeInfo.path);
            }
          }}
        />

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <DashboardMobileNav mode={activeMode} />}
      </div>
    </div>
  );
};

export default DashboardShell;
