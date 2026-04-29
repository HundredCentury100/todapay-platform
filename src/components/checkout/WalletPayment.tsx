import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useUserWallet } from "@/hooks/useUserWallet";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { cn } from "@/lib/utils";

interface WalletPaymentProps {
  amount: number;
  onPaymentComplete: (data: { methodType: string; transactionRef: string; walletTransactionId: string }) => void;
  disabled?: boolean;
}

export function WalletPayment({ amount, onPaymentComplete, disabled }: WalletPaymentProps) {
  const { user } = useAuth();
  const { wallet, isLoading } = useUserWallet();
  const { convertPrice } = useCurrency();
  const { play } = useNotificationSound();
  const [paying, setPaying] = useState(false);

  const balance = wallet?.balance || 0;
  const hasEnough = balance >= amount;

  if (!user || isLoading) return null;

  // Fire-and-forget auto top-up via TodaPay when balance drops below threshold
  const triggerAutoTopUp = async (walletId: string, topUpAmount: number, userId: string) => {
    try {
      const returnUrl = `${window.location.origin}/payment-callback`;
      const { data, error } = await supabase.functions.invoke('toda-pay', {
        body: {
          action: 'initiate',
          amount: topUpAmount,
          currencyCode: 'USD',
          reason: `Auto top-up - Wallet balance low`,
          resultUrl: returnUrl,
          returnUrl,
        },
      });

      if (error || !data?.success) {
        console.warn('Auto top-up initiation failed:', data?.error || error);
        return;
      }

      // Store ref for callback - but don't redirect during checkout
      // Instead, do the top-up silently via the payment webhook when pesepay completes
      sessionStorage.setItem('toda_auto_topup_ref', JSON.stringify({
        referenceNumber: data.referenceNumber,
        type: 'wallet_topup',
        walletId,
        userId,
        amount: topUpAmount,
      }));

      // Notify user that auto top-up was triggered
      await supabase.functions.invoke("send-wallet-notification", {
        body: {
          userId,
          transactionType: "auto_topup_initiated",
          amount: topUpAmount,
          description: `Auto top-up of $${topUpAmount.toFixed(2)} initiated. Complete payment to add funds.`,
        },
      }).catch(console.warn);

      // Insert in-app notification
      supabase.from('user_notifications').insert({
        user_id: userId,
        title: '⚡ Auto Top-Up Initiated',
        message: `Your balance dropped below the threshold. A $${topUpAmount.toFixed(2)} top-up has been initiated via TodaPay.`,
        type: 'wallet',
        category: 'payment',
        metadata: { type: 'auto_topup', amount: topUpAmount, redirectUrl: data.redirectUrl },
      }).then(() => {});

    } catch (err) {
      console.warn('Auto top-up error:', err);
    }
  };

  const handlePay = async () => {
    if (!wallet?.id || !hasEnough) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.rpc("deduct_user_wallet", {
        p_wallet_id: wallet.id,
        p_amount: amount,
        p_description: "Booking payment",
      });

      if (error) throw error;

      // Trigger notification via edge function
      try {
        await supabase.functions.invoke("send-wallet-notification", {
          body: {
            userId: user.id,
            transactionType: "debit",
            amount,
            description: "Booking payment",
            walletTransactionId: data?.id,
          },
        });
      } catch (notifErr) {
        console.warn("Notification failed:", notifErr);
      }

      // Check auto top-up threshold after debit
      const newBalance = balance - amount;
      if (
        wallet.auto_topup_enabled &&
        wallet.auto_topup_amount &&
        wallet.auto_topup_threshold &&
        newBalance < wallet.auto_topup_threshold
      ) {
        triggerAutoTopUp(wallet.id, wallet.auto_topup_amount, user.id);
      }

      play("wallet_debit");
      onPaymentComplete({
        methodType: "wallet",
        transactionRef: `WLT-${data?.id || Date.now()}`,
        walletTransactionId: data?.id || "",
      });
    } catch (err) {
      console.error("Wallet payment failed:", err);
    } finally {
      setPaying(false);
    }
  };

  return (
    <Card className={cn(
      "rounded-2xl p-4 border-2 transition-all",
      hasEnough ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Pay with Wallet</p>
          <p className="text-xs text-muted-foreground">
            Balance: {convertPrice(balance)}
          </p>
        </div>
        {hasEnough ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <AlertCircle className="h-5 w-5 text-destructive" />
        )}
      </div>

      {hasEnough ? (
        <Button
          onClick={handlePay}
          disabled={paying || disabled}
          className="w-full h-12 rounded-full font-semibold"
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Pay {convertPrice(amount)} from Wallet
            </>
          )}
        </Button>
      ) : (
        <div className="text-center">
          <p className="text-xs text-destructive mb-2">
            Insufficient balance. You need {convertPrice(amount - balance)} more.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => window.location.href = "/pay"}
          >
            Top Up Wallet
          </Button>
        </div>
      )}
    </Card>
  );
}
