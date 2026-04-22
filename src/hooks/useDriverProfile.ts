import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface DriverProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  license_plate: string;
  is_online: boolean;
  is_available: boolean;
  rating: number;
  total_rides: number;
  total_earnings: number;
  acceptance_rate: number;
  cancellation_rate: number;
  license_verified: boolean;
  insurance_verified: boolean;
  background_check_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useDriverProfile(userId?: string) {
  const queryClient = useQueryClient();

  const {
    data: driver,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['driver-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching driver profile:', error);
        return null;
      }

      return data as DriverProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<DriverProfile>) => {
      if (!driver?.id) throw new Error('No driver profile');
      
      const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', driver.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile', userId] });
      toast.success('Profile updated');
    },
    onError: (error) => {
      console.error('Error updating driver profile:', error);
      toast.error('Failed to update profile');
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (vehicleData: {
      vehicle_make?: string;
      vehicle_model?: string;
      vehicle_year?: number;
      vehicle_color?: string;
      license_plate?: string;
    }) => {
      if (!driver?.id) throw new Error('No driver profile');
      
      const { data, error } = await supabase
        .from('drivers')
        .update(vehicleData)
        .eq('id', driver.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile', userId] });
      toast.success('Vehicle info updated');
    },
    onError: (error) => {
      console.error('Error updating vehicle info:', error);
      toast.error('Failed to update vehicle info');
    },
  });

  const toggleOnlineStatus = async (online: boolean) => {
    if (!driver?.id || !userId) return;
    
    try {
      // If going online, check wallet balance >= $5
      if (online) {
        const { data: walletCheck, error: checkError } = await supabase
          .rpc('check_driver_can_go_online' as any, { p_user_id: userId });

        if (checkError) throw checkError;

        const result = walletCheck as { allowed: boolean; balance: number; wallet_id: string };
        if (!result.allowed) {
          toast.error(`Top up required — balance: $${result.balance.toFixed(2)}`, {
            description: 'Minimum $5.00 needed to go online. Tap "Top Up" on your wallet card.',
            duration: 6000,
          });
          return { blocked: true, balance: result.balance };
        }
      }

      const { error } = await supabase
        .from('drivers')
        .update({ 
          is_online: online,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driver.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['driver-profile', userId] });
      toast.success(online ? 'You are now online' : 'You are now offline');
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  return {
    driver,
    isLoading,
    error,
    // Mutations
    updateProfile: updateProfileMutation.mutate,
    updateVehicle: updateVehicleMutation.mutate,
    toggleOnlineStatus,
    isUpdating: updateProfileMutation.isPending || updateVehicleMutation.isPending,
  };
}
