import { motion } from "framer-motion";
import { CheckCircle2, Clock, Car, MapPin, Navigation, Flag, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TransferStatus = 
  | 'pending' | 'confirmed' | 'driver_assigned' 
  | 'driver_en_route' | 'driver_arrived' | 'in_progress' 
  | 'completed' | 'cancelled';

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Booked', icon: Clock, description: 'Finding your driver' },
  { key: 'driver_assigned', label: 'Driver Assigned', icon: Car, description: 'Driver confirmed' },
  { key: 'driver_en_route', label: 'En Route', icon: Navigation, description: 'Driver on the way' },
  { key: 'driver_arrived', label: 'Arrived', icon: MapPin, description: 'At pickup point' },
  { key: 'in_progress', label: 'In Progress', icon: Car, description: 'Trip underway' },
  { key: 'completed', label: 'Completed', icon: Flag, description: 'Trip finished' },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0, confirmed: 0, driver_assigned: 1,
  driver_en_route: 2, driver_arrived: 3, in_progress: 4, completed: 5,
};

interface TransferTimelineProps {
  currentStatus: TransferStatus;
  className?: string;
}

export const TransferTimeline = ({ currentStatus, className }: TransferTimelineProps) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className={cn("flex items-center gap-3 p-4 rounded-2xl bg-destructive/10", className)}>
        <X className="h-6 w-6 text-destructive" />
        <div>
          <p className="font-semibold text-destructive">Transfer Cancelled</p>
          <p className="text-xs text-muted-foreground">This transfer has been cancelled</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[currentStatus] ?? 0;

  return (
    <div className={cn("space-y-1", className)}>
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </motion.div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div className={cn(
                  "w-0.5 h-6 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>

            {/* Label */}
            <div className="pb-4">
              <p className={cn(
                "text-sm font-medium",
                isCurrent && "text-primary",
                isFuture && "text-muted-foreground"
              )}>
                {step.label}
              </p>
              {(isCompleted || isCurrent) && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
