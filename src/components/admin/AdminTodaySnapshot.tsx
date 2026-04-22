import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Zap, DollarSign, Receipt, UserPlus, AlertTriangle, Tag, Shield, Wallet,
} from "lucide-react";

interface TodayStats {
  bookingsToday: number;
  revenueToday: number;
  newUsersToday: number;
  pendingVerifications: number;
  billPaymentsToday: number;
  billRevenueToday: number;
  activePromos: number;
  vouchersIssued: number;
  escrowHeld?: number;
  escrowReleased?: number;
  totalBillVolume?: number;
  totalBillCount?: number;
}

interface AdminTodaySnapshotProps {
  stats: TodayStats;
  formatCurrency: (amount: number) => string;
}

export const AdminTodaySnapshot = ({ stats, formatCurrency }: AdminTodaySnapshotProps) => {
  const navigate = useNavigate();

  const cards = [
    {
      label: "Bookings Today", value: stats.bookingsToday, borderColor: "border-l-primary",
      icon: Zap, iconBg: "bg-primary/10", iconColor: "text-primary",
    },
    {
      label: "Revenue Today", value: formatCurrency(stats.revenueToday), borderColor: "border-l-green-500",
      icon: DollarSign, iconBg: "bg-green-500/10", iconColor: "text-green-500",
    },
    {
      label: "Bill Payments Today", value: stats.billPaymentsToday, borderColor: "border-l-emerald-500",
      icon: Receipt, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500",
      sub: `${formatCurrency(stats.billRevenueToday)} collected`,
      onClick: () => navigate("/merchant/admin/bill-reconciliation"),
    },
    {
      label: "Escrow Held", value: formatCurrency(stats.escrowHeld || 0), borderColor: "border-l-cyan-500",
      icon: Shield, iconBg: "bg-cyan-500/10", iconColor: "text-cyan-500",
      sub: `${formatCurrency(stats.escrowReleased || 0)} released`,
      onClick: () => navigate("/merchant/admin/escrow"),
    },
    {
      label: "Total Bill Volume", value: formatCurrency(stats.totalBillVolume || 0), borderColor: "border-l-indigo-500",
      icon: Wallet, iconBg: "bg-indigo-500/10", iconColor: "text-indigo-500",
      sub: `${stats.totalBillCount || 0} transactions all-time`,
      onClick: () => navigate("/merchant/admin/bill-reconciliation"),
    },
    {
      label: "New Users Today", value: stats.newUsersToday, borderColor: "border-l-blue-500",
      icon: UserPlus, iconBg: "bg-blue-500/10", iconColor: "text-blue-500",
    },
    {
      label: "Pending Verifications", value: stats.pendingVerifications, borderColor: "border-l-amber-500",
      icon: AlertTriangle, iconBg: "bg-amber-500/10", iconColor: "text-amber-500",
      onClick: () => navigate("/merchant/admin/merchant-verification"),
    },
    {
      label: "Promos & Vouchers", value: stats.activePromos, borderColor: "border-l-pink-500",
      icon: Tag, iconBg: "bg-pink-500/10", iconColor: "text-pink-500",
      sub: `${stats.vouchersIssued} vouchers issued`,
      onClick: () => navigate("/merchant/admin/promos"),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={`border-l-4 ${card.borderColor} ${card.onClick ? "cursor-pointer" : ""}`}
            onClick={card.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.sub && <p className="text-[10px] text-muted-foreground">{card.sub}</p>}
                </div>
                <div className={`p-2 ${card.iconBg} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
