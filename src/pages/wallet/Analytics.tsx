import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useUserWallet } from "@/hooks/useUserWallet";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { useMemo } from "react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function WalletAnalytics() {
  const { transactions } = useUserWallet();
  const navigate = useNavigate();

  const { byCategory, byDay } = useMemo(() => {
    const cats: Record<string, number> = {};
    const days: Record<string, number> = {};
    transactions.forEach((t) => {
      if (["payment", "debit", "transfer"].includes(t.transaction_type)) {
        const cat = t.transaction_type === "transfer" ? "Transfers" : "Payments";
        cats[cat] = (cats[cat] || 0) + Math.abs(t.amount);
        const day = new Date(t.created_at).toLocaleDateString("en-US", { weekday: "short" });
        days[day] = (days[day] || 0) + Math.abs(t.amount);
      }
    });
    return {
      byCategory: Object.entries(cats).map(([name, value]) => ({ name, value })),
      byDay: Object.entries(days).map(([day, spend]) => ({ day, spend })),
    };
  }, [transactions]);

  const totalSpent = byCategory.reduce((s, c) => s + c.value, 0);

  return (
    <div className="min-h-screen bg-[hsl(var(--revolut-bg))] text-[hsl(var(--revolut-text))]">
      <div className="px-4 pt-12 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="revolut-action-btn h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Analytics</h1>
          <div className="w-10" />
        </div>

        <div className="revolut-card rounded-3xl p-6 mb-4">
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--revolut-text-muted))]">Total spent</p>
          <p className="text-3xl font-bold mt-1">${totalSpent.toFixed(2)}</p>

          <div className="h-48 mt-6">
            <ResponsiveContainer>
              <BarChart data={byDay}>
                <XAxis dataKey="day" stroke="hsl(var(--revolut-text-muted))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--revolut-card-elevated))", border: "1px solid hsl(var(--revolut-border))", borderRadius: 8, color: "white" }} />
                <Bar dataKey="spend" fill="hsl(var(--revolut-accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="revolut-card rounded-3xl p-6">
          <h3 className="font-semibold mb-4">By category</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-[hsl(var(--revolut-text-muted))] text-center py-8">No spending data yet</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ color: "white", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
