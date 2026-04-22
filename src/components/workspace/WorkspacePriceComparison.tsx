import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface WorkspacePriceComparisonProps {
  hourlyRate?: number | null;
  dailyRate?: number | null;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
}

export const WorkspacePriceComparison = ({
  hourlyRate,
  dailyRate,
  weeklyRate,
  monthlyRate,
}: WorkspacePriceComparisonProps) => {
  const { convertPrice } = useCurrency();

  const rates = [
    { label: "Hourly", rate: hourlyRate, icon: Clock, period: "/hr", savings: null },
    { label: "Daily", rate: dailyRate, icon: CalendarDays, period: "/day", savings: hourlyRate && dailyRate ? Math.round((1 - dailyRate / (hourlyRate * 8)) * 100) : null },
    { label: "Weekly", rate: weeklyRate, icon: CalendarRange, period: "/wk", savings: dailyRate && weeklyRate ? Math.round((1 - weeklyRate / (dailyRate * 5)) * 100) : null },
    { label: "Monthly", rate: monthlyRate, icon: Calendar, period: "/mo", savings: weeklyRate && monthlyRate ? Math.round((1 - monthlyRate / (weeklyRate * 4)) * 100) : null },
  ].filter(r => r.rate);

  if (rates.length <= 1) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Pricing Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rates.map(({ label, rate, icon: Icon, period, savings }) => (
            <div
              key={label}
              className="relative p-4 rounded-xl border border-border hover:border-primary/50 transition-colors text-center"
            >
              {savings && savings > 0 && (
                <Badge variant="secondary" className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Save {savings}%
                </Badge>
              )}
              <Icon className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-lg font-bold text-primary">{convertPrice(rate!)}</p>
              <p className="text-xs text-muted-foreground">{period}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
