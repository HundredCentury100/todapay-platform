import { useState, useEffect, useCallback } from "react";
import { useUserRoles } from "./useUserRoles";

export type DashboardMode = "consumer" | "merchant" | "driver" | "admin";

export interface DashboardModeInfo {
  mode: DashboardMode;
  label: string;
  path: string;
}

const MODE_STORAGE_KEY = "dashboard_mode";

export const useDashboardMode = () => {
  const roles = useUserRoles();
  const [currentMode, setCurrentMode] = useState<DashboardMode>("consumer");

  // Get available modes based on user roles
  const getAvailableModes = useCallback((): DashboardModeInfo[] => {
    const modes: DashboardModeInfo[] = [];

    // Everyone gets consumer mode
    modes.push({
      mode: "consumer",
      label: "Personal",
      path: "/dashboard",
    });

    // Add driver mode if user is a driver
    if (roles.isDriver) {
      modes.push({
        mode: "driver",
        label: "Driver",
        path: "/driver",
      });
    }

    // Add merchant mode if user is a merchant
    if (roles.isMerchant && roles.merchantRole) {
      const merchantPath = getMerchantPath(roles.merchantRole);
      modes.push({
        mode: "merchant",
        label: getMerchantLabel(roles.merchantRole),
        path: merchantPath,
      });
    }

    // Add admin mode if user is admin
    if (roles.isAdmin) {
      modes.push({
        mode: "admin",
        label: "Admin",
        path: "/merchant/admin",
      });
    }

    return modes;
  }, [roles]);

  // Load saved mode on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as DashboardMode;
    const availableModes = getAvailableModes();
    
    if (savedMode && availableModes.some(m => m.mode === savedMode)) {
      setCurrentMode(savedMode);
    } else if (availableModes.length > 0) {
      setCurrentMode(availableModes[0].mode);
    }
  }, [getAvailableModes]);

  // Switch mode
  const switchMode = useCallback((mode: DashboardMode) => {
    const availableModes = getAvailableModes();
    if (availableModes.some(m => m.mode === mode)) {
      setCurrentMode(mode);
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  }, [getAvailableModes]);

  // Get current mode info
  const getCurrentModeInfo = useCallback((): DashboardModeInfo | undefined => {
    return getAvailableModes().find(m => m.mode === currentMode);
  }, [currentMode, getAvailableModes]);

  return {
    currentMode,
    availableModes: getAvailableModes(),
    switchMode,
    getCurrentModeInfo,
    hasMultipleModes: getAvailableModes().length > 1,
    isLoading: roles.isLoading,
    ...roles,
  };
};

function getMerchantPath(role: string): string {
  const paths: Record<string, string> = {
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
  };
  return paths[role] || "/merchant/portal";
}

function getMerchantLabel(role: string): string {
  const labels: Record<string, string> = {
    bus_operator: "Bus Operator",
    event_organizer: "Event Organizer",
    venue_owner: "Venue Owner",
    property_owner: "Property Owner",
    airline_partner: "Airline",
    workspace_provider: "Workspace",
    car_rental_company: "Car Rental",
    transfer_provider: "Transfers",
    experience_host: "Experiences",
    travel_agent: "Agent",
    booking_agent: "Agent",
  };
  return labels[role] || "Merchant";
}
