import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompleteTransferResult {
  success: boolean;
  gross_amount?: number;
  platform_fee?: number;
  net_amount?: number;
  error?: string;
}

export const useCompleteTransfer = () => {
  const [loading, setLoading] = useState(false);

  const completeTransfer = async (
    transferRequestId: string,
    finalPrice?: number
  ): Promise<CompleteTransferResult> => {
    setLoading(true);
    try {
      // Use raw SQL call since the function was just created and types aren't updated yet
      const { data, error } = await supabase.rpc('complete_transfer_request' as any, {
        p_transfer_request_id: transferRequestId,
        p_final_price: finalPrice || null
      });

      if (error) throw error;

      const result = (data as unknown) as CompleteTransferResult;

      if (result.success) {
         toast.success("Transfer completed!", {
           description: `Earned $${result.net_amount?.toFixed(0)} (after $${result.platform_fee?.toFixed(0)} platform fee)`
        });
      } else {
        toast.error(result.error || "Failed to complete transfer");
      }

      return result;
    } catch (error: any) {
      console.error('Complete transfer error:', error);
      toast.error(error.message || "Failed to complete transfer");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { completeTransfer, loading };
};
