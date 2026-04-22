import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AcceptTransferResult {
  success: boolean;
  share_code?: string;
  credits_deducted?: number;
  new_balance?: number;
  error?: string;
  balance?: number;
}

export const useAcceptTransfer = () => {
  const [loading, setLoading] = useState(false);

  const acceptTransfer = async (
    transferRequestId: string,
    driverId: string,
    vehicleId?: string
  ): Promise<AcceptTransferResult> => {
    setLoading(true);
    try {
      // Use raw SQL call since the function was just created and types aren't updated yet
      const { data, error } = await supabase.rpc('accept_transfer_request' as any, {
        p_transfer_request_id: transferRequestId,
        p_driver_id: driverId,
        p_vehicle_id: vehicleId || null
      });

      if (error) throw error;

      const result = (data as unknown) as AcceptTransferResult;

      if (result.success) {
        toast.success("Transfer accepted!", {
          description: `${result.credits_deducted} credits deducted. Balance: ${result.new_balance}`
        });
      } else {
        toast.error(result.error || "Failed to accept transfer");
      }

      return result;
    } catch (error: any) {
      console.error('Accept transfer error:', error);
      toast.error(error.message || "Failed to accept transfer");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { acceptTransfer, loading };
};
