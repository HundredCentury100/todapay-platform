import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MerchantRole } from "@/types/merchant";

export interface UserRoles {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMerchant: boolean;
  isDriver: boolean;
  driverId: string | null;
  merchantRole: MerchantRole | null;
  merchantProfileId: string | null;
  isAgent: boolean;
  isBusOperator: boolean;
  isEventOrganizer: boolean;
  isVenueOwner: boolean;
  isPropertyOwner: boolean;
  isAirlinePartner: boolean;
  isWorkspaceProvider: boolean;
  isCarRentalCompany: boolean;
  isTransferProvider: boolean;
  isExperienceHost: boolean;
  availableRoles: string[];
}

export const useUserRoles = (): UserRoles => {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [merchantRole, setMerchantRole] = useState<MerchantRole | null>(null);
  const [merchantProfileId, setMerchantProfileId] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsLoading(false);
        setIsAdmin(false);
        setMerchantRole(null);
        setMerchantProfileId(null);
        setIsDriver(false);
        setDriverId(null);
        setAvailableRoles([]);
        return;
      }

      try {
        setIsLoading(true);
        const roles: string[] = ['user'];

        // Check admin status from user_roles table
        const { data: adminData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (adminData) {
          setIsAdmin(true);
          roles.push('admin');
        } else {
          setIsAdmin(false);
        }

        // Check merchant profile and driver profile in parallel
        const [merchantResult, driverResult] = await Promise.all([
          supabase
            .from('merchant_profiles')
            .select('id, role, verification_status')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('drivers')
            .select('id, status')
            .eq('user_id', user.id)
            .maybeSingle()
        ]);

        const merchantData = merchantResult.data;
        const driverData = driverResult.data;

        if (merchantData && ['verified', 'pending'].includes(merchantData.verification_status)) {
          setMerchantRole(merchantData.role as MerchantRole);
          setMerchantProfileId(merchantData.id);
          roles.push(merchantData.role);
        } else {
          setMerchantRole(null);
          setMerchantProfileId(null);
        }

        if (driverData && ['active', 'pending'].includes(driverData.status)) {
          setIsDriver(true);
          setDriverId(driverData.id);
          roles.push('driver');
        } else {
          setIsDriver(false);
          setDriverId(null);
        }

        setAvailableRoles(roles);
      } catch (error) {
        console.error('Error fetching user roles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, [user, authLoading]);

  const isAgent = merchantRole === 'travel_agent' || merchantRole === 'booking_agent';
  const isBusOperator = merchantRole === 'bus_operator';
  const isEventOrganizer = merchantRole === 'event_organizer';
  const isVenueOwner = merchantRole === 'venue_owner';
  const isPropertyOwner = merchantRole === 'property_owner';
  const isAirlinePartner = merchantRole === 'airline_partner';
  const isWorkspaceProvider = merchantRole === 'workspace_provider';
  const isCarRentalCompany = merchantRole === 'car_rental_company';
  const isTransferProvider = merchantRole === 'transfer_provider';
  const isExperienceHost = merchantRole === 'experience_host';
  const isMerchant = !!merchantRole;

  return {
    isLoading: isLoading || authLoading,
    isAuthenticated: !!user,
    isAdmin,
    isMerchant,
    isDriver,
    driverId,
    merchantRole,
    merchantProfileId,
    isAgent,
    isBusOperator,
    isEventOrganizer,
    isVenueOwner,
    isPropertyOwner,
    isAirlinePartner,
    isWorkspaceProvider,
    isCarRentalCompany,
    isTransferProvider,
    isExperienceHost,
    availableRoles,
  };
};
