import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountMenu } from "./AccountMenu";
import { DashboardMode, DashboardModeInfo } from "@/hooks/useDashboardMode";

interface DashboardHeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  currentMode: DashboardMode;
  availableModes: DashboardModeInfo[];
  onSwitchMode: (mode: DashboardMode) => void;
}

export const DashboardHeader = ({
  isSidebarCollapsed,
  onToggleSidebar,
  currentMode,
  availableModes,
  onSwitchMode,
}: DashboardHeaderProps) => {
  const [notificationCount] = useState(3);

  return (
    <header className="h-14 border-b bg-card sticky top-0 z-40 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        {/* Search - Desktop */}
        <div className="hidden md:flex items-center relative max-w-md">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 h-9 w-64 bg-muted/50 border-0 focus-visible:ring-1"
          />
          <kbd className="absolute right-3 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="text-xs">
                {notificationCount} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">New booking confirmed</span>
              <span className="text-xs text-muted-foreground">
                Bus ticket to Harare - 2 hours ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">Payment received</span>
              <span className="text-xs text-muted-foreground">
                $25.00 added to wallet - 5 hours ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium text-sm">Ride completed</span>
              <span className="text-xs text-muted-foreground">
                Rate your driver - 1 day ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center">
              <Link to="/notifications" className="text-primary text-sm">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account Menu */}
        <AccountMenu
          currentMode={currentMode}
          availableModes={availableModes}
          onSwitchMode={onSwitchMode}
        />
      </div>
    </header>
  );
};
