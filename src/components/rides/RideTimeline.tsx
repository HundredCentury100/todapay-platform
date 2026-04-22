import { motion } from "framer-motion";
import { Check, Clock, MapPin, Car, Navigation, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ActiveRideStatus } from "@/types/ride";

interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  time?: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface RideTimelineProps {
  currentStatus: ActiveRideStatus;
  driverAssignedAt?: string;
  driverArrivedAt?: string;
  pickupTime?: string;
  dropoffTime?: string;
  etaMinutes?: number;
  className?: string;
}

const STATUS_ORDER: ActiveRideStatus[] = [
  'driver_assigned',
  'driver_arriving',
  'arrived_at_pickup',
  'in_progress',
  'completed',
];

export function RideTimeline({
  currentStatus,
  driverAssignedAt,
  driverArrivedAt,
  pickupTime,
  dropoffTime,
  etaMinutes,
  className,
}: RideTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return undefined;
    return format(new Date(timestamp), 'h:mm a');
  };

  const steps: TimelineStep[] = [
    {
      id: 'driver_assigned',
      label: 'Driver matched',
      description: 'Your driver has accepted the ride',
      icon: <Check className="h-4 w-4" />,
      time: formatTime(driverAssignedAt),
      status: getStepStatus(0),
    },
    {
      id: 'driver_arriving',
      label: 'Driver on the way',
      description: etaMinutes ? `ETA ${etaMinutes} minutes` : 'Heading to pickup',
      icon: <Car className="h-4 w-4" />,
      status: getStepStatus(1),
    },
    {
      id: 'arrived_at_pickup',
      label: 'Driver arrived',
      description: 'Your driver is waiting at pickup',
      icon: <MapPin className="h-4 w-4" />,
      time: formatTime(driverArrivedAt),
      status: getStepStatus(2),
    },
    {
      id: 'in_progress',
      label: 'On trip',
      description: 'Heading to your destination',
      icon: <Navigation className="h-4 w-4" />,
      time: formatTime(pickupTime),
      status: getStepStatus(3),
    },
    {
      id: 'completed',
      label: 'Arrived',
      description: 'You have reached your destination',
      icon: <Flag className="h-4 w-4" />,
      time: formatTime(dropoffTime),
      status: getStepStatus(4),
    },
  ];

  return (
    <div className={cn("space-y-1", className)}>
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3"
        >
          {/* Timeline Line & Dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                step.status === 'completed' && "bg-primary border-primary text-primary-foreground",
                step.status === 'current' && "bg-primary/20 border-primary text-primary animate-pulse",
                step.status === 'upcoming' && "bg-muted border-border text-muted-foreground"
              )}
            >
              {step.status === 'current' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                step.icon
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 h-12 transition-all duration-300",
                  step.status === 'completed' ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "font-medium transition-colors",
                  step.status === 'completed' && "text-foreground",
                  step.status === 'current' && "text-primary",
                  step.status === 'upcoming' && "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {step.time && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {step.time}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default RideTimeline;
