import { Bus, Calendar, MapPin, TrendingUp } from "lucide-react";

interface TravelStatsCardProps {
  totalTrips?: number;
  citiesVisited?: number;
  memberSince?: string;
  favoriteRoute?: string;
}

export function TravelStatsCard({
  totalTrips = 0,
  citiesVisited = 0,
  memberSince,
  favoriteRoute,
}: TravelStatsCardProps) {
  const stats = [
    { 
      icon: Bus, 
      value: totalTrips.toString(), 
      label: 'Total Trips',
      color: 'text-blue-500'
    },
    { 
      icon: MapPin, 
      value: citiesVisited.toString(), 
      label: 'Cities',
      color: 'text-green-500'
    },
    { 
      icon: Calendar, 
      value: memberSince ? new Date(memberSince).getFullYear().toString() : '-', 
      label: 'Member Since',
      color: 'text-purple-500'
    },
  ];

  return (
    <div className="bg-card border-b">
      <div className="px-4 py-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Travel Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        {favoriteRoute && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <span className="text-muted-foreground">Favorite Route: </span>
              <span className="font-medium">{favoriteRoute}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
