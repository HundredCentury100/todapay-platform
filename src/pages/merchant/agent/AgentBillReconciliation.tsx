import { useState, useMemo } from "react";
import { assignReconRefs } from "@/utils/reconciliationRef";
import { useQuery } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Receipt, TrendingUp, Download, Banknote, Smartphone, CreditCard, Calendar, Wallet, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, startOfDay, endOfDay, subDays, isToday, isWithinInterval } from "date-fns";
import { AgentFloatBalanceCard } from "@/components/agent/AgentFloatBalanceCard";
import { getFloatAccount } from "@/services/agentFloatService";

type ShiftFilter = "all" | "morning" | "afternoon" | "custom";

export default function AgentBillReconciliation() {
  const { merchantProfile } = useMerchantAuth();
  const isExternalAgent = merchantProfile?.role === 'booking_agent';
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "week" | "custom">("today");

  const { data: floatAccount } = useQuery({
    queryKey: ['agent-float-recon', merchantProfile?.id],
    queryFn: () => merchantProfile ? getFloatAccount(merchantProfile.id) : Promise.resolve(null),
    enabled: !!merchantProfile?.id && isExternalAgent,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['agent-bill-reconciliation', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from("bill_payments")
        .select("*")
        .eq("agent_profile_id", merchantProfile.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const filtered = useMemo(() => {
    let start: Date, end: Date;
    const now = new Date();

    switch (dateRange) {
      case "today": start = startOfDay(now); end = endOfDay(now); break;
      case "yesterday": start = startOfDay(subDays(now, 1)); end = endOfDay(subDays(now, 1)); break;
      case "week": start = startOfDay(subDays(now, 7)); end = endOfDay(now); break;
      case "custom": start = startOfDay(new Date(customStart)); end = endOfDay(new Date(customEnd)); break;
    }

    const dateFiltered = payments.filter((p: any) => {
      const date = new Date(p.created_at);
      if (!isWithinInterval(date, { start, end })) return false;

      if (shiftFilter === "morning") {
        return date.getHours() < 13;
      } else if (shiftFilter === "afternoon") {
        return date.getHours() >= 13;
      }
      return true;
    });

    return assignReconRefs(dateFiltered);
  }, [payments, dateRange, shiftFilter, customStart, customEnd]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const completed = filtered.filter((p: any) => p.status === "completed");
    const pending = filtered.filter((p: any) => p.status === "pending_fulfillment");

    const byBiller: Record<string, { count: number; total: number }> = {};
    const byMethod: Record<string, { count: number; total: number }> = {};

    filtered.forEach((p: any) => {
      const biller = p.biller_name || "Unknown";
      if (!byBiller[biller]) byBiller[biller] = { count: 0, total: 0 };
      byBiller[biller].count++;
      byBiller[biller].total += p.amount || 0;

      const method = p.payment_method || "unknown";
      if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 };
      byMethod[method].count++;
      byMethod[method].total += p.amount || 0;
    });

    const cashTotal = (byMethod["cash"]?.total || 0);
    const digitalTotal = total - cashTotal;

    return { total, count: filtered.length, completed: completed.length, pending: pending.length, byBiller, byMethod, cashTotal, digitalTotal };
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Date", "Time", "Recon Ref", "Biller", "Account", "Customer", "Amount", "Currency", "Method", "Status", "Payment Ref"];
    const rows = filtered.map((p: any) => [
      format(new Date(p.created_at), "yyyy-MM-dd"),
      format(new Date(p.created_at), "HH:mm"),
      p.reconRef,
      p.biller_name, p.account_number, (p as any).customer_name || "",
      p.amount, p.currency, p.payment_method, p.status, p.transaction_reference,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
  };

  const methodIcon = (method: string) => {
    switch (method) {
      case "cash": return <Banknote className="w-4 h-4" />;
      case "pos": return <CreditCard className="w-4 h-4" />;
      default: return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Bill Reconciliation</h1>
          <p className="text-sm text-muted-foreground">End-of-day collection summary</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export Handover Report
        </Button>
      </div>

      {isExternalAgent && (
        <AgentFloatBalanceCard floatAccount={floatAccount || null} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        <Select value={shiftFilter} onValueChange={(v) => setShiftFilter(v as ShiftFilter)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shifts</SelectItem>
            <SelectItem value="morning">Morning (AM)</SelectItem>
            <SelectItem value="afternoon">Afternoon (PM)</SelectItem>
          </SelectContent>
        </Select>

        {dateRange === "custom" && (
          <div className="flex gap-2 items-center">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-36" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-36" />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">$ {stats.total.toFixed(2)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{stats.count} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Cash In Hand</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-green-600">$ {stats.cashTotal.toFixed(2)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Physical cash collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Digital Payments</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">$ {stats.digitalTotal.toFixed(2)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Suvat Pay, POS, etc.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{stats.completed}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{stats.pending} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">By Biller</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byBiller).sort(([,a], [,b]) => b.total - a.total).map(([name, data]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{name}</span>
                  <Badge variant="secondary" className="text-[10px]">{data.count}</Badge>
                </div>
                <span className="font-bold">$ {data.total.toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(stats.byBiller).length === 0 && (
              <p className="text-sm text-muted-foreground">No transactions for this period</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">By Payment Method</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byMethod).sort(([,a], [,b]) => b.total - a.total).map(([method, data]) => (
              <div key={method} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {methodIcon(method)}
                  <span className="font-medium capitalize">{method.replace("_", " ")}</span>
                  <Badge variant="secondary" className="text-[10px]">{data.count}</Badge>
                </div>
                <span className="font-bold">$ {data.total.toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(stats.byMethod).length === 0 && (
              <p className="text-sm text-muted-foreground">No transactions for this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                 <tr className="border-b bg-muted/50">
                   <th className="text-left px-3 py-2 font-medium">Time</th>
                   <th className="text-left px-3 py-2 font-medium">Recon Ref</th>
                   <th className="text-left px-3 py-2 font-medium">Biller</th>
                   <th className="text-left px-3 py-2 font-medium">Account</th>
                   <th className="text-left px-3 py-2 font-medium">Customer</th>
                   <th className="text-left px-3 py-2 font-medium">Biller Type</th>
                   <th className="text-left px-3 py-2 font-medium">Payment Method</th>
                   <th className="text-right px-3 py-2 font-medium">Amount</th>
                   {isExternalAgent && <th className="text-right px-3 py-2 font-medium">Net Deduction</th>}
                   <th className="text-center px-3 py-2 font-medium">Status</th>
                 </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transactions for this period
                    </td>
                  </tr>
                ) : (
                  filtered.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {format(new Date(p.created_at), "HH:mm")}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                        {p.reconRef}
                      </td>
                      <td className="px-3 py-2 font-medium">{p.biller_name}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{p.account_number}</td>
                      <td className="px-3 py-2">{p.customer_name || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {(p.biller_type || "other").replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          className="text-[10px] capitalize gap-1"
                          variant={p.payment_method === "cash" ? "default" : "secondary"}
                        >
                          {methodIcon(p.payment_method || "unknown")}
                          {(p.payment_method || "unknown").replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">
                        {p.currency} {(p.amount || 0).toFixed(2)}
                      </td>
                      {isExternalAgent && (
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {(() => {
                            const commRate = (merchantProfile?.commission_rate || 10) / 100;
                            const net = (p.amount || 0) - ((p.amount || 0) * commRate);
                            return `${p.currency} ${net.toFixed(2)}`;
                          })()}
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={p.status === "completed" ? "default" : "secondary"}
                          className={`text-[10px] ${p.status === "completed" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200" : ""}`}
                        >
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cash Handover Summary */}
      {stats.cashTotal > 0 && (
        <Alert className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Cash Handover Required</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You have <strong>${stats.cashTotal.toFixed(2)}</strong> in physical cash collected across{" "}
              <strong>{stats.byMethod["cash"]?.count || 0}</strong> transactions. Please hand over this amount to your supervisor at end of shift.
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs text-amber-600 dark:text-amber-400">
              <span>Digital payments (no handover needed): <strong>${stats.digitalTotal.toFixed(2)}</strong></span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
