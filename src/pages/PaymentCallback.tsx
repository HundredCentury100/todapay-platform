import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/ui/BrandLogo";

type PaymentState = 'checking' | 'success' | 'failed';
type PaymentType = 'booking' | 'driver_wallet_topup' | 'wallet_topup' | 'unknown';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<PaymentState>('checking');
  const [paymentType, setPaymentType] = useState<PaymentType>('unknown');
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const storedRef = sessionStorage.getItem('suvat_pay_ref');
      if (!storedRef) {
        setState('failed');
        return;
      }

      const parsed = JSON.parse(storedRef);
      const { referenceNumber, bookingId, type, walletId, userId, amount } = parsed;
      
      const detectedType: PaymentType = type === 'driver_wallet_topup' ? 'driver_wallet_topup' 
        : type === 'wallet_topup' ? 'wallet_topup' 
        : bookingId ? 'booking' : 'unknown';
      setPaymentType(detectedType);
      if (amount) setTopUpAmount(amount);

      const { data, error } = await supabase.functions.invoke('suvat-pay', {
        body: {
          action: 'check-status',
          referenceNumber,
        },
      });

      if (error) throw error;

      if (data?.paid) {
        sessionStorage.removeItem('suvat_pay_ref');

        // Handle driver wallet top-up
        if (detectedType === 'driver_wallet_topup' && walletId) {
          try {
            await supabase.rpc('topup_user_wallet', {
              p_wallet_id: walletId,
              p_amount: amount,
              p_payment_reference: `suvat-topup-${referenceNumber}`,
              p_description: `Driver wallet top-up via Suvat Pay`,
            });

            // Send notification
            if (userId) {
              await supabase.functions.invoke('send-user-notification', {
                body: {
                  userId,
                  type: 'wallet_topup',
                  title: 'Wallet Top-Up Successful! 💰',
                  body: `$${amount.toFixed(2)} has been added to your driver wallet via Suvat Pay.`,
                  data: { amount, referenceNumber, type: 'driver_wallet_topup' },
                },
              }).catch(console.warn);
            }
          } catch (walletErr) {
            console.error('Wallet top-up error:', walletErr);
            setState('failed');
            return;
          }
        }

        // Handle regular wallet top-up
        if (detectedType === 'wallet_topup' && walletId) {
          try {
            await supabase.rpc('topup_user_wallet', {
              p_wallet_id: walletId,
              p_amount: amount,
              p_payment_reference: `suvat-topup-${referenceNumber}`,
              p_description: `Wallet top-up via Suvat Pay`,
            });

            // Send wallet notification
            if (userId) {
              await supabase.functions.invoke('send-wallet-notification', {
                body: {
                  userId,
                  transactionType: 'topup',
                  amount,
                  description: 'Wallet top-up via Suvat Pay',
                },
              }).catch(console.warn);
            }
          } catch (walletErr) {
            console.error('Wallet top-up error:', walletErr);
            setState('failed');
            return;
          }
        }

        // Handle booking payment
        if (detectedType === 'booking' && bookingId) {
          await supabase.from('bookings').update({
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId);
        }

        setState('success');
      } else if (data?.status === 'FAILED' || data?.status === 'CANCELLED') {
        setState('failed');
        sessionStorage.removeItem('suvat_pay_ref');
      } else if (attempts < 5) {
        setTimeout(() => {
          setAttempts(a => a + 1);
          checkPaymentStatus();
        }, 3000);
      } else {
        setState('failed');
      }
    } catch (err) {
      console.error('Payment check error:', err);
      if (attempts < 3) {
        setTimeout(() => {
          setAttempts(a => a + 1);
          checkPaymentStatus();
        }, 3000);
      } else {
        setState('failed');
      }
    }
  };

  const getSuccessAction = () => {
    if (paymentType === 'driver_wallet_topup') {
      return { label: 'Back to Driver Profile', path: '/driver/profile' };
    }
    if (paymentType === 'wallet_topup') {
      return { label: 'Back to Wallet', path: '/pay' };
    }
    return { label: 'View My Bookings', path: '/orders' };
  };

  const successAction = getSuccessAction();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl">
          <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-center text-primary-foreground">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BrandLogo size="xs" variant="white" />
              <h3 className="font-bold text-sm tracking-wide">SUVAT PAY</h3>
            </div>
          </div>

          <CardContent className="p-8 text-center space-y-6">
            {state === 'checking' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Verifying Payment</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait while we confirm your payment...
                  </p>
                </div>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  {paymentType === 'driver_wallet_topup' || paymentType === 'wallet_topup' ? (
                    <Wallet className="h-8 w-8 text-primary" />
                  ) : (
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    {paymentType === 'driver_wallet_topup' || paymentType === 'wallet_topup'
                      ? 'Wallet Topped Up!'
                      : 'Payment Successful!'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paymentType === 'driver_wallet_topup' || paymentType === 'wallet_topup'
                      ? `$${topUpAmount.toFixed(2)} has been added to your wallet.`
                      : 'Your payment has been processed securely via Suvat Pay'}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(successAction.path)}
                  className="w-full rounded-xl h-12 touch-manipulation"
                >
                  {successAction.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {state === 'failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-destructive">Payment Failed</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    We couldn't verify your payment. Please try again.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate(-1)}
                    className="w-full rounded-xl h-12 touch-manipulation"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="w-full rounded-xl touch-manipulation"
                  >
                    Back to Home
                  </Button>
                </div>
              </motion.div>
            )}

            <p className="text-[10px] text-muted-foreground/60">
              Powered by <span className="font-semibold">Suvat Pay</span> · Toda Technologies
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
