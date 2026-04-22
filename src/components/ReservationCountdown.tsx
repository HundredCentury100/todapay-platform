import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReservationCountdownProps {
  expiresAt: Date;
  variant?: "default" | "destructive" | "warning";
}

const ReservationCountdown = ({ expiresAt, variant = "default" }: ReservationCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setExpired(true);
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const badgeVariant = expired ? "destructive" : variant === "warning" ? "secondary" : "default";

  return (
    <Badge variant={badgeVariant} className="flex items-center gap-1.5">
      <Clock className="h-3 w-3" />
      {timeLeft}
    </Badge>
  );
};

export default ReservationCountdown;
