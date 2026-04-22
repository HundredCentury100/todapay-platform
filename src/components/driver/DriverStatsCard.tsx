import { Car, Target, XCircle, Star } from "lucide-react";

interface DriverStatsCardProps {
  totalRides?: number;
  acceptanceRate?: number;
  cancellationRate?: number;
  rating?: number;
}

export function DriverStatsCard({
  totalRides = 0,
  acceptanceRate = 0,
  cancellationRate = 0,
  rating = 0,
}: DriverStatsCardProps) {
  const getAcceptanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getCancellationColor = (rate: number) => {
    if (rate <= 5) return 'text-green-500';
    if (rate <= 10) return 'text-amber-500';
    return 'text-red-500';
  };

  const stats = [
    { 
      icon: Car, 
      value: totalRides.toString(), 
      label: 'Rides',
      color: 'text-blue-500'
    },
    { 
      icon: Target, 
      value: `${acceptanceRate}%`, 
      label: 'Acceptance',
      color: getAcceptanceColor(acceptanceRate)
    },
    { 
      icon: XCircle, 
      value: `${cancellationRate}%`, 
      label: 'Cancellation',
      color: getCancellationColor(cancellationRate)
    },
    { 
      icon: Star, 
      value: rating.toFixed(1), 
      label: 'Rating',
      color: 'text-amber-500'
    },
  ];

  return (
    <div className="bg-card border-b">
      <div className="px-4 py-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Performance</h3>
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
