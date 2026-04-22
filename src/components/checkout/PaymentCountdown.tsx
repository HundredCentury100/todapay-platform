import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle } from "lucide-react";

interface PaymentCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
  showProgress?: boolean;
}

export const PaymentCountdown = ({
  expiresAt,
  onExpired,
  showProgress = true,
}: PaymentCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    total: number;
    percentage: number;
  }>({ minutes: 0, seconds: 0, total: 0, percentage: 100 });
  const [isExpired, setIsExpired] = useState(false);
  const [initialTotal, setInitialTotal] = useState<number | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        onExpired?.();
        return { minutes: 0, seconds: 0, total: 0, percentage: 0 };
      }

      const totalSeconds = Math.floor(difference / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      // Set initial total on first calculation
      if (initialTotal === null) {
        setInitialTotal(totalSeconds);
      }

      const percentage = initialTotal 
        ? Math.max(0, Math.min(100, (totalSeconds / initialTotal) * 100))
        : 100;

      return { minutes, seconds, total: totalSeconds, percentage };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, initialTotal, onExpired]);

  const getUrgencyLevel = () => {
    if (timeLeft.total <= 60) return 'critical'; // Less than 1 minute
    if (timeLeft.total <= 300) return 'warning'; // Less than 5 minutes
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  if (isExpired) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Reservation Expired</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 transition-colors ${
      urgency === 'critical' 
        ? 'border-destructive bg-destructive/5 animate-pulse' 
        : urgency === 'warning'
        ? 'border-amber-500 bg-amber-50'
        : 'border-primary/20 bg-primary/5'
    }`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${
              urgency === 'critical' 
                ? 'text-destructive' 
                : urgency === 'warning'
                ? 'text-amber-600'
                : 'text-primary'
            }`} />
            <span className="text-sm font-medium">
              {urgency === 'critical' 
                ? 'Complete payment now!' 
                : 'Reservation expires in'}
            </span>
          </div>
          
          <Badge 
            variant={urgency === 'critical' ? 'destructive' : 'secondary'}
            className={`text-lg font-mono px-3 py-1 ${
              urgency === 'warning' ? 'bg-amber-100 text-amber-700' : ''
            }`}
          >
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </Badge>
        </div>

        {showProgress && (
          <Progress 
            value={timeLeft.percentage} 
            className={`h-1 mt-3 ${
              urgency === 'critical' 
                ? '[&>div]:bg-destructive' 
                : urgency === 'warning'
                ? '[&>div]:bg-amber-500'
                : ''
            }`}
          />
        )}

        {urgency === 'critical' && (
          <p className="text-xs text-destructive mt-2 text-center">
            Your seats will be released if payment is not completed
          </p>
        )}
      </CardContent>
    </Card>
  );
};
