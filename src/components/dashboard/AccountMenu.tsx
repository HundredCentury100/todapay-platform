import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Settings, Moon, Sun, ChevronDown, Building2, Car, Shield, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { DashboardMode, DashboardModeInfo } from "@/hooks/useDashboardMode";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  currentMode: DashboardMode;
  availableModes: DashboardModeInfo[];
  onSwitchMode: (mode: DashboardMode) => void;
}

export const AccountMenu = ({
  currentMode,
  availableModes,
  onSwitchMode,
}: AccountMenuProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  const getModeIcon = (mode: DashboardMode) => {
    switch (mode) {
      case "consumer":
        return User;
      case "merchant":
        return Building2;
      case "driver":
        return Car;
      case "admin":
        return Shield;
      default:
        return User;
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "User";
  const email = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Mode Switcher */}
        {availableModes.length > 1 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                {(() => {
                  const ModeIcon = getModeIcon(currentMode);
                  return <ModeIcon className="h-4 w-4" />;
                })()}
                <span>Switch Mode</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {availableModes.map((modeInfo) => {
                  const ModeIcon = getModeIcon(modeInfo.mode);
                  return (
                    <DropdownMenuItem
                      key={modeInfo.mode}
                      onClick={() => {
                        onSwitchMode(modeInfo.mode);
                        navigate(modeInfo.path);
                        setOpen(false);
                      }}
                      className={cn(
                        "gap-2",
                        currentMode === modeInfo.mode && "bg-accent"
                      )}
                    >
                      <ModeIcon className="h-4 w-4" />
                      <span>{modeInfo.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={() => navigate("/pay")} className="gap-2">
          <Wallet className="h-4 w-4" />
          <span>Wallet</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="gap-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="gap-2"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
