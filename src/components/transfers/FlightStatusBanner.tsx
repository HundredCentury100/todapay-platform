import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, CheckCircle2, AlertTriangle, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlightStatusBannerProps {
  flightNumber: string;
  scheduledTime?: string;
  className?: string;
}

type FlightStatus = 'on_time' | 'delayed' | 'landed' | 'unknown';

const STATUS_CONFIG: Record<FlightStatus, { label: string; color: string; bgColor: string; icon: typeof Plane }> = {
  on_time: { label: 'On Time', color: 'text-green-600', bgColor: 'bg-green-500/10 border-green-500/20', icon: CheckCircle2 },
  delayed: { label: 'Delayed', color: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
  landed: { label: 'Landed', color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/20', icon: ArrowDown },
  unknown: { label: 'Status Unknown', color: 'text-muted-foreground', bgColor: 'bg-muted border-border', icon: Plane },
};

export const FlightStatusBanner = ({ flightNumber, scheduledTime, className }: FlightStatusBannerProps) => {
  // Simulated flight status - in production this would call a flight tracking API
  const [status, setStatus] = useState<FlightStatus>('unknown');
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    // Simulate flight status check
    const timer = setTimeout(() => {
      const statuses: FlightStatus[] = ['on_time', 'on_time', 'on_time', 'delayed', 'landed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setStatus(randomStatus);

      if (scheduledTime) {
        const scheduled = new Date(scheduledTime);
        if (randomStatus === 'delayed') {
          scheduled.setMinutes(scheduled.getMinutes() + 45);
        }
        setEta(scheduled.toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [flightNumber, scheduledTime]);

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Card className={cn("rounded-2xl border overflow-hidden", config.bgColor, className)}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", config.bgColor)}>
          <Plane className={cn("h-5 w-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm">{flightNumber}</p>
            <Badge variant="outline" className={cn("text-[10px] h-5 gap-0.5", config.color)}>
              <Icon className="h-2.5 w-2.5" />
              {config.label}
            </Badge>
          </div>
          {eta && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {status === 'delayed' ? 'New arrival' : 'Expected'}: {eta}
              {status === 'delayed' && (
                <span className="text-amber-600 font-medium ml-1">+45 min</span>
              )}
            </p>
          )}
        </div>

        {status === 'delayed' && (
          <div className="text-right">
            <p className="text-[10px] text-amber-600 font-medium">Pickup adjusted</p>
            <p className="text-[10px] text-muted-foreground">automatically</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
