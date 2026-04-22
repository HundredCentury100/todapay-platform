import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Bus, CalendarDays, Building2, Hotel, Plane, Laptop, Car, Truck, Compass,
} from "lucide-react";

export interface VerticalStats {
  vertical: string;
  totalBookings: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalRevenue: number;
  paidCount: number;
}

export const VERTICALS = [
  { key: "bus", label: "Bus Transport", icon: Bus, color: "hsl(var(--chart-1))" },
  { key: "event", label: "Events", icon: CalendarDays, color: "hsl(var(--chart-2))" },
  { key: "venue", label: "Venues", icon: Building2, color: "hsl(var(--chart-3))" },
  { key: "stay", label: "Stays & Hotels", icon: Hotel, color: "hsl(var(--chart-4))" },
  { key: "flight", label: "Flights", icon: Plane, color: "hsl(var(--chart-5))" },
  { key: "workspace", label: "Workspaces", icon: Laptop, color: "hsl(var(--chart-1))" },
  { key: "car_rental", label: "Car Rental", icon: Car, color: "hsl(var(--chart-2))" },
  { key: "transfer", label: "Transfers", icon: Truck, color: "hsl(var(--chart-3))" },
  { key: "experience", label: "Experiences", icon: Compass, color: "hsl(var(--chart-4))" },
];

interface AdminVerticalGridProps {
  verticalStats: VerticalStats[];
  activeVertical: string | null;
  onVerticalClick: (key: string | null) => void;
  formatCurrency: (amount: number) => string;
}

export const AdminVerticalGrid = ({
  verticalStats, activeVertical, onVerticalClick, formatCurrency,
}: AdminVerticalGridProps) => {
  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-3">Service Verticals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {VERTICALS.map((v) => {
          const stats = verticalStats.find((s) => s.vertical === v.key);
          const Icon = v.icon;
          const isActive = activeVertical === v.key;
          const totalForVertical = stats?.totalBookings || 0;
          const confirmedRate = totalForVertical > 0 ? ((stats?.confirmed || 0) / totalForVertical) * 100 : 0;
          return (
            <Card
              key={v.key}
              className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-primary" : ""}`}
              onClick={() => onVerticalClick(isActive ? null : v.key)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ background: `${v.color}20` }}>
                    <Icon className="h-4 w-4" style={{ color: v.color }} />
                  </div>
                  <p className="text-xs sm:text-sm font-medium truncate">{v.label}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Bookings</span>
                    <span className="font-semibold">{stats?.totalBookings || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold">{formatCurrency(stats?.totalRevenue || 0)}</span>
                  </div>
                  <Progress value={confirmedRate} className="h-1 mt-1" />
                  <p className="text-[10px] text-muted-foreground">{confirmedRate.toFixed(0)}% confirmed</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
