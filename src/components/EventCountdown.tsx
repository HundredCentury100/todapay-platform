import { useState, useEffect } from "react";
import { Clock, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EventCountdownProps {
  eventDate: string;
  eventTime: string;
  availableTickets?: number;
  totalTickets?: number;
}

const EventCountdown = ({ eventDate, eventTime, availableTickets, totalTickets }: EventCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(`${eventDate}T${eventTime}`);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventDate, eventTime]);

  const soldPercentage = totalTickets && availableTickets 
    ? ((totalTickets - availableTickets) / totalTickets) * 100 
    : 0;
  
  const isSellingFast = soldPercentage > 60;
  const isAlmostSoldOut = availableTickets && availableTickets < 50;
  const isLastFew = availableTickets && availableTickets < 10;

  return (
    <div className="space-y-4">
      {/* Countdown Timer */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Event starts in</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Mins" },
            { value: timeLeft.seconds, label: "Secs" },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="bg-background rounded-lg p-2 border border-border/50 shadow-sm">
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Urgency Indicators */}
      <div className="flex flex-wrap gap-2">
        {isLastFew && (
          <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Only {availableTickets} tickets left!
          </Badge>
        )}
        
        {!isLastFew && isAlmostSoldOut && (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Less than 50 tickets remaining
          </Badge>
        )}
        
        {isSellingFast && !isLastFew && (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Selling Fast - {Math.round(soldPercentage)}% sold
          </Badge>
        )}

        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {Math.floor(Math.random() * 20) + 5} people viewing
        </Badge>
      </div>
    </div>
  );
};

export default EventCountdown;
