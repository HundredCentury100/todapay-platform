import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Cell } from "recharts";

interface AnalyticsCardProps {
  weeklyData?: Array<{ day: string; spend: number }>;
  totalSpent?: number;
  currency?: string;
  symbol?: string;
}

const defaultData = [
  { day: "Mon", spend: 24 },
  { day: "Tue", spend: 48 },
  { day: "Wed", spend: 12 },
  { day: "Thu", spend: 67 },
  { day: "Fri", spend: 89 },
  { day: "Sat", spend: 34 },
  { day: "Sun", spend: 18 },
];

export function AnalyticsCard({
  weeklyData = defaultData,
  totalSpent,
  symbol = "$",
}: AnalyticsCardProps) {
  const total = totalSpent ?? weeklyData.reduce((s, d) => s + d.spend, 0);
  const max = Math.max(...weeklyData.map((d) => d.spend));

  return (
    <Link
      to="/wallet/analytics"
      className="revolut-card rounded-3xl p-5 block hover:bg-[hsl(var(--revolut-card-elevated))] transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-[hsl(var(--revolut-text-muted))] uppercase tracking-wider">
          Spent this week
        </p>
        <ChevronRight className="h-4 w-4 text-[hsl(var(--revolut-text-muted))]" />
      </div>
      <p className="text-2xl font-bold text-[hsl(var(--revolut-text))]">
        {symbol}
        {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      <div className="h-20 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} barCategoryGap="20%">
            <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
              {weeklyData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.spend === max ? "hsl(var(--revolut-accent))" : "hsl(0 0% 100% / 0.15)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between mt-2">
        {weeklyData.map((d) => (
          <span key={d.day} className="text-[10px] text-[hsl(var(--revolut-text-muted))] flex-1 text-center">
            {d.day}
          </span>
        ))}
      </div>
    </Link>
  );
}
