import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign, Activity, Users, TrendingUp, CheckCircle, BarChart3, ArrowRight,
} from "lucide-react";
import { VerticalStats } from "./AdminVerticalGrid";

interface AdminPlatformMetricsProps {
  verticalStats: VerticalStats[];
  merchants: any[];
  revenueStats: { totalRevenue: number; monthlyRevenue: number; weeklyRevenue: number; outstandingFees: number };
  formatCurrency: (amount: number) => string;
}

export const AdminPlatformMetrics = ({
  verticalStats, merchants, revenueStats, formatCurrency,
}: AdminPlatformMetricsProps) => {
  const navigate = useNavigate();

  const totalStats = useMemo(() => {
    return verticalStats.reduce(
      (acc, v) => ({
        bookings: acc.bookings + v.totalBookings,
        revenue: acc.revenue + v.totalRevenue,
        pending: acc.pending + v.pending,
        confirmed: acc.confirmed + v.confirmed,
      }),
      { bookings: 0, revenue: 0, pending: 0, confirmed: 0 }
    );
  }, [verticalStats]);

  const confirmationRate = totalStats.bookings > 0
    ? ((totalStats.confirmed / totalStats.bookings) * 100)
    : 0;

  const cards = [
    {
      title: "Platform Fees", value: formatCurrency(revenueStats.totalRevenue),
      icon: DollarSign, sub: "View details", href: "/merchant/admin/financial",
    },
    {
      title: "Total Bookings", value: totalStats.bookings,
      icon: Activity, sub: "All verticals", href: "/merchant/admin/transactions",
    },
    {
      title: "Merchants", value: merchants.length,
      icon: Users, href: "/merchant/admin/merchant-verification",
      badges: [
        { label: `${merchants.filter(m => m.verification_status === "verified").length} verified`, variant: "default" as const },
        { label: `${merchants.filter(m => m.verification_status === "pending").length} pending`, variant: "secondary" as const },
      ],
    },
    {
      title: "Gross Revenue", value: formatCurrency(totalStats.revenue),
      icon: TrendingUp, sub: "All services", href: "/merchant/admin/billing-control",
    },
    {
      title: "Confirmation Rate", value: `${confirmationRate.toFixed(0)}%`,
      icon: CheckCircle, href: "/merchant/admin/payouts", progress: confirmationRate,
    },
    {
      title: "Analytics", value: "Insights",
      icon: BarChart3, sub: "View", href: "/merchant/admin/billing-analytics",
    },
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
      <div className="flex gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 min-w-max sm:min-w-0">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="cursor-pointer hover:shadow-md transition-shadow min-w-[140px] sm:min-w-0"
              onClick={() => navigate(card.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold">{card.value}</div>
                {card.badges ? (
                  <div className="flex gap-1 mt-1">
                    {card.badges.map((b, i) => (
                      <Badge key={i} variant={b.variant} className="text-[9px] px-1">{b.label}</Badge>
                    ))}
                  </div>
                ) : card.progress !== undefined ? (
                  <Progress value={card.progress} className="h-1.5 mt-1" />
                ) : (
                  <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    {card.sub} <ArrowRight className="h-3 w-3" />
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
