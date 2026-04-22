import { MapPin } from "lucide-react";

interface RouteTimelineProps {
  stops: string[];
  from: string;
  to: string;
}

const RouteTimeline = ({ stops, from, to }: RouteTimelineProps) => {
  const allStops = [from, ...(stops || []), to];

  return (
    <div className="relative">
      <div className="space-y-2">
        {allStops.map((stop, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${index === 0 || index === allStops.length - 1 ? 'bg-primary' : 'bg-muted-foreground'}`} />
              {index < allStops.length - 1 && (
                <div className="w-0.5 h-8 bg-border" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <p className={`text-sm ${index === 0 || index === allStops.length - 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
                {stop}
              </p>
              {index === 0 && (
                <p className="text-xs text-muted-foreground">Pickup Point</p>
              )}
              {index === allStops.length - 1 && (
                <p className="text-xs text-muted-foreground">Drop-off Point</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteTimeline;
