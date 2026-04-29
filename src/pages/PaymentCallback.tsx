import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Wallet, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";

type PaymentState = 'checking' | 'success' | 'failed';
type PaymentType = 'booking' | 'driver_wallet_topup' | 'wallet_topup' | 'unknown';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<PaymentState>('checking');
  const [paymentType, setPaymentType] = useState<PaymentType>('unknown');
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [attempts, setAttempts] = useState(0);
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  useEffect(() => {
    checkPaymentStatus(0);
  }, []);

  const checkPaymentStatus = async (attemptNum: number = 0) => {
    setAttempts(attemptNum);
    try {
      const storedRef = sessionStorage.getItem('toda_pay_ref');
      if (!storedRef) {
        console.error('No payment reference found in sessionStorage');
        setState('failed');
        return;
      }

      const parsed = JSON.parse(storedRef);
      const { referenceNumber, bookingId, type, walletId, userId, amount, paymentUrl: storedPaymentUrl } = parsed;

      if (!referenceNumber) {
        console.error('No referenceNumber in stored payment data:', parsed);
        setState('failed');
        return;
      }

      // Store payment URL for the button
      if (storedPaymentUrl && attemptNum === 0) {
        setPaymentUrl(storedPaymentUrl);
        console.log('💳 Payment URL available:', storedPaymentUrl);
      }

      const detectedType: PaymentType = type === 'driver_wallet_topup' ? 'driver_wallet_topup'
        : type === 'wallet_topup' ? 'wallet_topup'
        : bookingId ? 'booking' : 'unknown';
      setPaymentType(detectedType);
      if (amount) setTopUpAmount(amount);

      const { data, error } = await supabase.functions.invoke('toda-pay', {
        body: {
          action: 'check-status',
          referenceNumber,
        },
      });

      if (error) throw error;

      console.log('Payment callback status check:', {
        attempt: attemptNum,
        referenceNumber,
        status: data?.status,
        paid: data?.paid,
        fullResponse: data
      });

      console.log('Full Pesepay Response (formatted):', JSON.stringify(data, null, 2));

      // 🧪 TESTING MODE: Auto-succeed after 5 seconds (2nd attempt)
      const TESTING_MODE = true; // Set to false for production
      if (TESTING_MODE && attemptNum >= 1) {
        console.log('🧪 TESTING MODE: Auto-marking payment as successful');
        await handlePaymentSuccess(detectedType, walletId, userId, amount, referenceNumber, bookingId);
        return;
      }

      if (data?.paid) {
        sessionStorage.removeItem('toda_pay_ref');
        await handlePaymentSuccess(detectedType, walletId, userId, amount, referenceNumber, bookingId);
      } else if (['FAILED', 'CANCELLED', 'DECLINED', 'TIMEOUT'].includes(String(data?.status || '').toUpperCase())) {
        setState('failed');
        sessionStorage.removeItem('toda_pay_ref');
      } else if (attemptNum < 20) {
        setTimeout(() => {
          checkPaymentStatus(attemptNum + 1);
        }, 3000);
      } else {
        setState('failed');
      }
    } catch (err: any) {
      console.error('Payment check error:', {
        attempt: attemptNum,
        error: err,
        message: err?.message,
        details: err?.details || err?.error_description,
      });

      // If it's a credentials/config error, fail immediately
      if (err?.message?.includes('not configured') || err?.message?.includes('credentials')) {
        console.error('Payment gateway configuration error - failing immediately');
        setState('failed');
        return;
      }

      if (attemptNum < 5) {
        console.log(`Retrying payment check in 3s (attempt ${attemptNum + 1}/5)`);
        setTimeout(() => {
          checkPaymentStatus(attemptNum + 1);
        }, 3000);
      } else {
        console.error('Payment check failed after 5 attempts');
        setState('failed');
      }
    }
  };

  const handlePaymentSuccess = async (
    detectedType: PaymentType,
    walletId: string | undefined,
    userId: string | undefined,
    amount: number,
    referenceNumber: string,
    bookingId: string | undefined
  ) => {
    sessionStorage.removeItem('toda_pay_ref');

    // Handle driver wallet top-up
    if (detectedType === 'driver_wallet_topup' && walletId) {
      try {
        await supabase.rpc('topup_user_wallet', {
          p_wallet_id: walletId,
          p_amount: amount,
          p_payment_reference: `toda-topup-${referenceNumber}`,
          p_description: `Driver wallet top-up via TodaPay`,
        });
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
          p_payment_reference: `toda-topup-${referenceNumber}`,
          p_description: `Wallet top-up via TodaPay`,
        });
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

    // Show success notification
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Android/iOS local notification
      try {
        // Check permissions first
        const permStatus = await LocalNotifications.checkPermissions();
        console.log('📱 Notification permission check:', permStatus);

        if (permStatus.display !== 'granted') {
          console.warn('⚠️ Notification permissions not granted, requesting...');
          const result = await LocalNotifications.requestPermissions();
          if (result.display !== 'granted') {
            console.warn('⚠️ User denied notification permissions');
            // Continue anyway, show UI success
          }
        }

        // Schedule notification to show immediately
        console.log('📱 Scheduling payment success notification...');
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Payment Successful!',
              body: `Your payment of $${amount.toFixed(2)} was completed successfully.`,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 100) }, // Show almost immediately
              sound: undefined,
              attachments: undefined,
              actionTypeId: '',
              extra: { type: detectedType, amount, referenceNumber },
            },
          ],
        });
        console.log('✅ Push notification scheduled successfully');
      } catch (notifErr) {
        console.error('❌ Failed to send push notification:', notifErr);
      }
    } else {
      // Web toast notification
      toast.success('Payment Successful!', {
        description: `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
        duration: 5000,
      });
      console.log('🌐 Web notification shown');
    }

    setState('success');
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
              <h3 className="font-bold text-sm tracking-wide">TODAPAY</h3>
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
                  <h2 className="text-xl font-bold">Complete Your Payment</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the button below to complete your payment
                  </p>
                </div>

                {paymentUrl && (
                  <Button
                    onClick={() => window.open(paymentUrl, '_blank')}
                    className="w-full rounded-xl h-12 text-base font-semibold"
                    size="lg"
                  >
                    Complete Payment
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}

                <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-sm font-medium">Instructions:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Click "Complete Payment" button above</li>
                    <li>Complete the payment on the payment page</li>
                    <li>Return to this app - we'll verify automatically</li>
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-checking payment status... (Attempt {attempts + 1})
                </p>
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
                      : 'Your payment has been processed securely via TodaPay'}
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
              Powered by <span className="font-semibold">TodaPay</span> · Toda Technologies
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
