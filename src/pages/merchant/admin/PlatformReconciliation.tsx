import { useState, useMemo } from "react";
import { assignReconRefs } from "@/utils/reconciliationRef";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, Wallet, Receipt, Download, RefreshCw, Search,
  Bus, Calendar, Home, Car, Plane, Briefcase, MapPin, Sparkles, Zap,
  CreditCard, Banknote, Smartphone, Building,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

const VERTICALS = [
  { key: "bus", label: "Bus", icon: Bus },
  { key: "event", label: "Events", icon: Calendar },
  { key: "stay", label: "Stays", icon: Home },
  { key: "car_rental", label: "Car Rental", icon: Car },
  { key: "flight", label: "Flights", icon: Plane },
  { key: "workspace", label: "Workspaces", icon: Briefcase },
  { key: "transfer", label: "Transfers", icon: MapPin },
  { key: "experience", label: "Experiences", icon: Sparkles },
  { key: "venue", label: "Venues", icon: Building },
  { key: "bill_payment", label: "Bill Payments", icon: Zap },
];

const PLATFORM_FEE_PCT = 10;

export default function PlatformReconciliation() {
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d" | "all">("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("all");

  const dateStart = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "today": return startOfDay(now).toISOString();
      case "7d": return startOfDay(subDays(now, 7)).toISOString();
      case "30d": return startOfDay(subDays(now, 30)).toISOString();
      case "90d": return startOfDay(subDays(now, 90)).toISOString();
      default: return null;
    }
  }, [dateRange]);

  // Fetch booking transactions (all verticals except bill payments)
  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ["platform-recon-transactions", dateStart],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          id, amount, platform_fee_amount, platform_fee_percentage, merchant_amount,
          payment_method, payment_status, transaction_reference, created_at,
          bookings(booking_reference, booking_type, item_name, passenger_name, vertical),
          merchant_profiles:merchant_profile_id(business_name)
        `)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (dateStart) query = query.gte("created_at", dateStart);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((tx: any) => ({
        ...tx,
        source: "booking",
        vertical: tx.bookings?.vertical || tx.bookings?.booking_type || "other",
        merchantName: tx.merchant_profiles?.business_name || "—",
        itemName: tx.bookings?.item_name || "—",
        bookingRef: tx.bookings?.booking_reference || "—",
      }));
    },
  });

  // Fetch bill payments
  const { data: billPayments = [], isLoading: billLoading, refetch: refetchBills } = useQuery({
    queryKey: ["platform-recon-bills", dateStart],
    queryFn: async () => {
      let query = supabase
        .from("bill_payments")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (dateStart) query = query.gte("created_at", dateStart);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((bp: any) => ({
        id: bp.id,
        amount: bp.amount,
        platform_fee_amount: 0, // Bill payments use service fee model
        platform_fee_percentage: 0,
        merchant_amount: bp.amount,
        payment_method: bp.payment_method || "cash",
        payment_status: bp.status,
        transaction_reference: bp.transaction_reference,
        created_at: bp.created_at,
        source: "bill_payment",
        vertical: "bill_payment",
        merchantName: bp.biller_name,
        itemName: `${bp.biller_name} - ${bp.account_number}`,
        bookingRef: bp.transaction_reference || "—",
      }));
    },
  });

  // Fetch escrow holds for payout summary
  const { data: escrowData = [], isLoading: escrowLoading } = useQuery({
    queryKey: ["platform-recon-escrow", dateStart],
    queryFn: async () => {
      let query = supabase
        .from("escrow_holds")
        .select(`
          id, amount, platform_fee_amount, merchant_amount, status, hold_until, released_at, created_at,
          merchant_profiles:merchant_profile_id(business_name, role)
        `)
        .limit(1000);

      if (dateStart) query = query.gte("created_at", dateStart);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = txLoading || billLoading || escrowLoading;

  const allRecords = useMemo(() => assignReconRefs([...transactions, ...billPayments]), [transactions, billPayments]);

  // Filtered
  const filtered = useMemo(() => {
    return allRecords.filter((r: any) => {
      if (verticalFilter !== "all" && r.vertical !== verticalFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (r.bookingRef || "").toLowerCase().includes(q) ||
          (r.merchantName || "").toLowerCase().includes(q) ||
          (r.itemName || "").toLowerCase().includes(q) ||
          (r.transaction_reference || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allRecords, verticalFilter, searchQuery]);

  // Platform stats
  const stats = useMemo(() => {
    const completedTx = transactions.filter((t: any) => t.payment_status === "completed");
    const cashPendingTx = transactions.filter((t: any) => t.payment_status === "cash_pending");
    const totalGrossRevenue = completedTx.reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const totalPlatformFees = completedTx.reduce((s: number, t: any) => s + (t.platform_fee_amount || 0), 0);
    const totalMerchantPayable = completedTx.reduce((s: number, t: any) => s + (t.merchant_amount || 0), 0);
    const billTotal = billPayments.reduce((s: number, b: any) => s + (b.amount || 0), 0);
    const cashPendingTotal = cashPendingTx.reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const cashPendingCount = cashPendingTx.length;

    // Escrow breakdown
    const pendingEscrow = (escrowData as any[]).filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + (e.merchant_amount || 0), 0);
    const releasedEscrow = (escrowData as any[]).filter((e: any) => e.status === "released").reduce((s: number, e: any) => s + (e.merchant_amount || 0), 0);

    // Per-vertical breakdown
    const byVertical: Record<string, { count: number; gross: number; fees: number; merchantDue: number }> = {};
    allRecords.forEach((r: any) => {
      const v = r.vertical || "other";
      if (!byVertical[v]) byVertical[v] = { count: 0, gross: 0, fees: 0, merchantDue: 0 };
      byVertical[v].count++;
      if (r.payment_status === "completed") {
        byVertical[v].gross += r.amount || 0;
        byVertical[v].fees += r.platform_fee_amount || 0;
        byVertical[v].merchantDue += r.merchant_amount || 0;
      }
    });

    // By payment method
    const byMethod: Record<string, { count: number; total: number }> = {};
    allRecords.forEach((r: any) => {
      const m = r.payment_method || "unknown";
      if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 };
      byMethod[m].count++;
      byMethod[m].total += r.amount || 0;
    });

    return {
      totalGrossRevenue: totalGrossRevenue + billTotal,
      totalPlatformFees,
      totalMerchantPayable,
      billTotal,
      pendingEscrow,
      releasedEscrow,
      transactionCount: allRecords.length,
      byVertical,
      byMethod,
      cashPendingTotal,
      cashPendingCount,
    };
  }, [transactions, billPayments, escrowData, allRecords]);

  const methodIcon = (method: string) => {
    if (method === "cash") return <Banknote className="h-3.5 w-3.5" />;
    if (method === "pos") return <CreditCard className="h-3.5 w-3.5" />;
    return <Smartphone className="h-3.5 w-3.5" />;
  };

  const verticalIcon = (key: string) => {
    const v = VERTICALS.find(v => v.key === key);
    if (!v) return <Receipt className="h-4 w-4" />;
    const Icon = v.icon;
    return <Icon className="h-4 w-4" />;
  };

  const exportCSV = () => {
    const headers = ["Date", "Recon Reference", "Vertical", "Source", "Merchant", "Item", "Booking Ref", "Payment Method", "Gross Amount", "Platform Fee", "Merchant Due", "Status"];
    const rows = filtered.map((r: any) => [
      format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
      r.reconRef, r.vertical, r.source, r.merchantName, r.itemName, r.bookingRef,
      r.payment_method, r.amount?.toFixed(2), r.platform_fee_amount?.toFixed(2),
      r.merchant_amount?.toFixed(2), r.payment_status,
    ]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platform-reconciliation-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Reconciliation report exported");
  };

  const refetchAll = () => { refetchTx(); refetchBills(); };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Platform Reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Cross-vertical financial overview with payout calculations
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refetchAll} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Gross Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold">${stats.totalGrossRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground">{stats.transactionCount} transactions</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-1 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs font-medium text-primary flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Platform Fees ({PLATFORM_FEE_PCT}%)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-primary">${stats.totalPlatformFees.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground">Platform earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Merchant Payable
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${stats.totalMerchantPayable.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground">After platform fees</p>
          </CardContent>
        </Card>
        <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50">
          <CardHeader className="pb-1 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" /> Cash Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              ${stats.cashPendingTotal.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground">{stats.cashPendingCount} awaiting collection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5" /> In Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              ${stats.pendingEscrow.toFixed(2)}
            </div>
            <p className="text-[10px] text-muted-foreground">Awaiting release</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-4 sm:pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Bill Collections
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="text-lg sm:text-2xl font-bold">${stats.billTotal.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground">Utility & bill payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Tabs */}
      <Tabs defaultValue="vertical" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="vertical">By Vertical</TabsTrigger>
          <TabsTrigger value="method">By Method</TabsTrigger>
          <TabsTrigger value="payout">Payout Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="vertical">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {VERTICALS.map(v => {
              const data = stats.byVertical[v.key];
              if (!data || data.count === 0) return null;
              const Icon = v.icon;
              return (
                <Card
                  key={v.key}
                  className={`cursor-pointer transition-all hover:shadow-md ${verticalFilter === v.key ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setVerticalFilter(verticalFilter === v.key ? "all" : v.key)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <span className="text-sm font-medium">{v.label}</span>
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross:</span>
                        <span className="font-semibold">${data.gross.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-primary">
                        <span>Fees:</span>
                        <span className="font-semibold">${data.fees.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Payout:</span>
                        <span className="font-bold">${data.merchantDue.toFixed(2)}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] mt-1">{data.count} txns</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="method">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {Object.entries(stats.byMethod).sort(([, a], [, b]) => b.total - a.total).map(([method, data]) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {methodIcon(method)}
                      <span className="text-sm font-medium capitalize">{method.replace("_", " ")}</span>
                      <Badge variant="secondary" className="text-[10px]">{data.count}</Badge>
                    </div>
                    <span className="font-bold text-sm">${data.total.toFixed(2)}</span>
                  </div>
                ))}
                {Object.keys(stats.byMethod).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data for this period</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout Summary by Merchant</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Gross Held</TableHead>
                      <TableHead className="text-right">Platform Fee</TableHead>
                      <TableHead className="text-right">Net Payable</TableHead>
                      <TableHead>Escrow Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Group escrow by merchant
                      const byMerchant: Record<string, {
                        name: string; role: string; gross: number; fees: number; net: number;
                        pending: number; released: number;
                      }> = {};
                      (escrowData as any[]).forEach((e: any) => {
                        const mid = e.merchant_profiles?.business_name || "Unknown";
                        if (!byMerchant[mid]) byMerchant[mid] = {
                          name: mid, role: e.merchant_profiles?.role || "—",
                          gross: 0, fees: 0, net: 0, pending: 0, released: 0,
                        };
                        byMerchant[mid].gross += e.amount || 0;
                        byMerchant[mid].fees += e.platform_fee_amount || 0;
                        byMerchant[mid].net += e.merchant_amount || 0;
                        if (e.status === "pending") byMerchant[mid].pending += e.merchant_amount || 0;
                        if (e.status === "released") byMerchant[mid].released += e.merchant_amount || 0;
                      });

                      const merchants = Object.values(byMerchant).sort((a, b) => b.net - a.net);
                      if (merchants.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No escrow data for this period
                            </TableCell>
                          </TableRow>
                        );
                      }
                      return merchants.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{m.role.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-right">${m.gross.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-primary">${m.fees.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ${m.net.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 flex-wrap">
                              {m.pending > 0 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  ${m.pending.toFixed(2)} held
                                </Badge>
                              )}
                              {m.released > 0 && (
                                <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200">
                                  ${m.released.toFixed(2)} ready
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Table */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              All Transactions {verticalFilter !== "all" && `— ${VERTICALS.find(v => v.key === verticalFilter)?.label}`}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchant, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={verticalFilter} onValueChange={setVerticalFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Vertical" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verticals</SelectItem>
                  {VERTICALS.map(v => (
                    <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No transactions found</p>
          ) : (
            <>
              {/* Mobile view */}
              <div className="sm:hidden space-y-2 px-4 pb-4">
                {filtered.slice(0, 50).map((r: any) => (
                  <Card key={r.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {verticalIcon(r.vertical)}
                        <span className="text-sm font-medium truncate">{r.merchantName}</span>
                      </div>
                      <Badge variant={r.payment_status === "completed" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {r.payment_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">{r.itemName}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {methodIcon(r.payment_method)}
                        <span className="text-xs capitalize text-muted-foreground">{(r.payment_method || "").replace("_", " ")}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">${(r.amount || 0).toFixed(2)}</span>
                        {r.platform_fee_amount > 0 && (
                          <span className="text-[10px] text-primary ml-1">-${r.platform_fee_amount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(r.created_at), "dd MMM HH:mm")} · <span className="font-mono">{r.reconRef}</span>
                    </p>
                  </Card>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Date</TableHead>
                       <TableHead>Reference</TableHead>
                       <TableHead>Vertical</TableHead>
                       <TableHead>Merchant</TableHead>
                       <TableHead>Item / Biller</TableHead>
                       <TableHead>Payment Method</TableHead>
                       <TableHead className="text-right">Gross</TableHead>
                       <TableHead className="text-right">Platform Fee</TableHead>
                       <TableHead className="text-right">Merchant Due</TableHead>
                       <TableHead>Status</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(r.created_at), "dd MMM HH:mm")}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {r.reconRef}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {verticalIcon(r.vertical)}
                            <span className="text-xs capitalize">{(r.vertical || "other").replace("_", " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{r.merchantName}</TableCell>
                        <TableCell className="text-sm max-w-[180px] truncate">{r.itemName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize gap-1">
                            {methodIcon(r.payment_method)}
                            {(r.payment_method || "unknown").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">${(r.amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right text-primary">${(r.platform_fee_amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ${(r.merchant_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.payment_status === "completed" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {r.payment_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filtered.length > 100 && (
                <p className="text-center text-sm text-muted-foreground py-3">
                  Showing 100 of {filtered.length} results
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
