import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getOrCreateUserWallet,
  getWalletTransactions,
  topUpWallet,
  updateWalletSettings,
  UserWallet,
  UserWalletTransaction,
} from "@/services/userWalletService";

export function useUserWallet() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: wallet,
    isLoading: isLoadingWallet,
    error: walletError,
  } = useQuery({
    queryKey: ['user-wallet', user?.id],
    queryFn: () => (user?.id ? getOrCreateUserWallet(user.id) : null),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
  } = useQuery({
    queryKey: ['user-wallet-transactions', wallet?.id],
    queryFn: () => (wallet?.id ? getWalletTransactions(wallet.id) : []),
    enabled: !!wallet?.id,
    staleTime: 30 * 1000,
  });

  const topUpMutation = useMutation({
    mutationFn: ({
      amount,
      paymentReference,
      description,
    }: {
      amount: number;
      paymentReference: string;
      description?: string;
    }) => {
      if (!wallet?.id) throw new Error('Wallet not found');
      return topUpWallet(wallet.id, amount, paymentReference, description);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-wallet', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-wallet-transactions', wallet?.id] });
      toast.success('Wallet topped up successfully!');
      // Send notification
      if (user?.id) {
        supabase.functions.invoke("send-wallet-notification", {
          body: {
            userId: user.id,
            transactionType: "topup",
            amount: variables.amount,
            description: variables.description || "Wallet top-up",
          },
        }).catch(console.warn);
      }
    },
    onError: (error) => {
      console.error('Error topping up wallet:', error);
      toast.error('Failed to top up wallet');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: {
      auto_topup_enabled?: boolean;
      auto_topup_amount?: number;
      auto_topup_threshold?: number;
    }) => {
      if (!wallet?.id) throw new Error('Wallet not found');
      return updateWalletSettings(wallet.id, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallet', user?.id] });
      toast.success('Wallet settings updated');
    },
    onError: (error) => {
      console.error('Error updating wallet settings:', error);
      toast.error('Failed to update settings');
    },
  });

  return {
    wallet,
    transactions: transactions || [],
    isLoading: isLoadingWallet,
    isLoadingTransactions,
    error: walletError,
    topUp: topUpMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    isTopping: topUpMutation.isPending,
    isUpdatingSettings: updateSettingsMutation.isPending,
    balance: wallet?.balance || 0,
    rewardsPoints: wallet?.rewards_points || 0,
  };
}
