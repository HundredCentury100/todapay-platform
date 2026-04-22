import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  QrCode, Smartphone, Copy, CheckCircle, RefreshCw, 
  Clock, ExternalLink, Loader2
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

interface QRCodePaymentProps {
  amount: number;
  currency?: string;
  provider: 'mpesa' | 'ecocash' | 'mtn_money' | 'airtel_money' | string;
  merchantNumber: string;
  reference: string;
  onPaymentVerified?: () => void;
  onCancel?: () => void;
}

export const QRCodePayment = ({
  amount,
  currency = 'ZAR',
  provider,
  merchantNumber,
  reference,
  onPaymentVerified,
  onCancel,
}: QRCodePaymentProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const [status, setStatus] = useState<'pending' | 'checking' | 'verified' | 'failed'>('pending');
  const [pollCount, setPollCount] = useState(0);
  const [expiresIn, setExpiresIn] = useState(300); // 5 minutes

  // Generate QR code data based on provider
  const generateQRData = () => {
    const baseData = {
      amount,
      currency,
      reference,
      merchantNumber,
      provider,
    };

    switch (provider) {
      case 'mpesa':
        // M-Pesa Pay Bill format
        return `00020101021227${merchantNumber.length.toString().padStart(2, '0')}${merchantNumber}5204${reference}5303${currency}5405${amount.toFixed(2)}6304`;
      
      case 'ecocash':
        // EcoCash format
        return JSON.stringify({
          type: 'ecocash_payment',
          merchant: merchantNumber,
          amount,
          ref: reference,
        });

      default:
        return JSON.stringify(baseData);
    }
  };

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setStatus('failed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Polling for payment verification
  useEffect(() => {
    if (status !== 'pending' || pollCount > 30) return;

    const pollInterval = setInterval(async () => {
      setStatus('checking');
      // Simulate checking payment status
      // In real implementation, this would call the payment verification endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('pending');
      setPollCount(prev => prev + 1);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(pollInterval);
  }, [status, pollCount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyReference = () => {
    navigator.clipboard.writeText(reference);
    toast({
      title: "Copied",
      description: "Reference number copied to clipboard",
    });
  };

  const getProviderName = () => {
    switch (provider) {
      case 'mpesa': return 'M-Pesa';
      case 'ecocash': return 'EcoCash';
      case 'mtn_money': return 'MTN Money';
      case 'airtel_money': return 'Airtel Money';
      default: return provider;
    }
  };

  const getProviderColor = () => {
    switch (provider) {
      case 'mpesa': return 'bg-green-500';
      case 'ecocash': return 'bg-red-500';
      case 'mtn_money': return 'bg-yellow-500';
      case 'airtel_money': return 'bg-red-600';
      default: return 'bg-primary';
    }
  };

  const handleManualVerify = () => {
    setStatus('checking');
    // Simulate verification
    setTimeout(() => {
      // In real implementation, this would verify with the payment gateway
      setStatus('pending');
      toast({
        title: "Checking...",
        description: "Looking for your payment. Please wait.",
      });
    }, 2000);
  };

  if (status === 'verified') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">Payment Verified!</h3>
          <p className="text-green-600">
            Your {getProviderName()} payment of {convertPrice(amount)} has been confirmed.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'failed' || expiresIn <= 0) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <Clock className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">QR Code Expired</h3>
          <p className="text-muted-foreground mb-4">
            The payment window has expired. Please try again.
          </p>
          <Button onClick={onCancel} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getProviderColor()}`} />
              Pay with {getProviderName()}
            </CardTitle>
            <Badge variant={expiresIn < 60 ? 'destructive' : 'secondary'}>
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(expiresIn)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-inner">
              <QRCode 
                value={generateQRData()} 
                size={200}
                level="H"
              />
            </div>
          </div>

          {/* Amount */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {convertPrice(amount)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Scan with your {getProviderName()} app
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Merchant Number</span>
              <span className="font-mono font-semibold">{merchantNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{reference}</span>
                <Button variant="ghost" size="sm" onClick={copyReference}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm">
            <p className="font-medium">How to pay:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open your {getProviderName()} app</li>
              <li>Tap "Scan & Pay" or "Scan QR"</li>
              <li>Scan this QR code</li>
              <li>Confirm the payment amount</li>
              <li>Complete the transaction</li>
            </ol>
          </div>

          {/* Status */}
          {status === 'checking' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Verifying your payment... Please wait.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          className="flex-1"
          onClick={handleManualVerify}
          disabled={status === 'checking'}
        >
          {status === 'checking' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          I've Paid
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Payment not going through? Try using the USSD code or contact support.
      </p>
    </div>
  );
};
