import { Bell, User, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { MerchantProfile } from "@/types/merchant";
import { NotificationCenter } from "@/components/agent/NotificationCenter";

interface MerchantHeaderProps {
  merchantProfile: MerchantProfile;
  onMenuToggle?: () => void;
}

const MerchantHeader = ({ merchantProfile, onMenuToggle }: MerchantHeaderProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isAgent = merchantProfile.role === 'travel_agent' || merchantProfile.role === 'booking_agent';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          {onMenuToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuToggle}
              className="lg:hidden shrink-0 h-10 w-10 tap-target"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
              {merchantProfile.role === 'admin' ? 'Admin Portal' : merchantProfile.business_name}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">
              {merchantProfile.role === 'admin' ? 'System Administration' : merchantProfile.business_email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAgent ? (
            <NotificationCenter agentProfileId={merchantProfile.id} />
          ) : (
            <Button variant="ghost" size="icon" className="h-10 w-10 tap-target">
              <Bell className="w-5 h-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 tap-target">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/merchant/${merchantProfile.role}/settings`)}>
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default MerchantHeader;
