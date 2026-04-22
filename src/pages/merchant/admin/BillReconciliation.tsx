import { useState, useEffect, useMemo } from "react";
import { assignReconRefs } from "@/utils/reconciliationRef";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Download, RefreshCw, Zap, Droplets, Phone,
  Receipt, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BillPayment {
  id: string;
  user_id: string | null;
  biller_type: string;
  biller_name: string;
  account_number: string;
  amount: number;
  currency: string;
  tokens: any;
  status: string;
  transaction_reference: string | null;
  payment_method: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

const BILLER_CATEGORIES: Record<string, { label: string; icon: React.ElementType; billers: string[] }> = {
  electricity: { label: "Electricity (ZESA)", icon: Zap, billers: ["ZETDC", "ZESA"] },
  water: { label: "Water (BCC)", icon: Droplets, billers: ["BCC"] },
  airtime: { label: "Airtime", icon: Phone, billers: ["Econet", "Netone", "Telecel"] },
  other: { label: "Other", icon: Receipt, billers: ["Nyaradzo", "Moonlight", "Edgars", "Jet"] },
};

const BillReconciliation = () => {
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load bill payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const withRefs = assignReconRefs(payments);
    return withRefs.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (activeCategory !== "all") {
        const cat = BILLER_CATEGORIES[activeCategory];
        if (cat && !cat.billers.some((b) => p.biller_name.toUpperCase().includes(b.toUpperCase()))) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.account_number.toLowerCase().includes(q) ||
          p.biller_name.toLowerCase().includes(q) ||
          (p.transaction_reference || "").toLowerCase().includes(q) ||
          p.reconRef.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, statusFilter, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = payments.length;
    const completed = payments.filter((p) => p.status === "completed").length;
    const pending = payments.filter((p) => p.status === "pending").length;
    const failed = payments.filter((p) => p.status === "failed").length;
    const totalValue = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const byCategory: Record<string, { count: number; value: number }> = {};
    Object.entries(BILLER_CATEGORIES).forEach(([key, cat]) => {
      const catPayments = payments.filter((p) =>
        cat.billers.some((b) => p.biller_name.toUpperCase().includes(b.toUpperCase()))
      );
      byCategory[key] = {
        count: catPayments.length,
        value: catPayments.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0),
      };
    });

    return { total, completed, pending, failed, totalValue, byCategory };
  }, [payments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Recon Reference", "Biller", "Type", "Account", "Amount", "Currency", "Status", "Payment Ref"];
    const rows = filteredPayments.map((p: any) => [
      format(new Date(p.created_at), "yyyy-MM-dd HH:mm"),
      p.reconRef,
      p.biller_name,
      p.biller_type,
      p.account_number,
      p.amount,
      p.currency,
      p.status,
      p.transaction_reference || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bill-reconciliation-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Bill Reconciliation</h1>
          <p className="text-sm text-muted-foreground">
            Track and reconcile ZESA, BCC, airtime, and other merchant bill payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPayments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-muted-foreground">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-destructive">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(BILLER_CATEGORIES).map(([key, cat]) => {
          const Icon = cat.icon;
          const catStats = stats.byCategory[key] || { count: 0, value: 0 };
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-shadow hover:shadow-md ${activeCategory === key ? "ring-2 ring-primary" : ""}`}
              onClick={() => setActiveCategory(activeCategory === key ? "all" : key)}
            >
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                  <p className="font-bold text-sm">{catStats.count} txns</p>
                  <p className="text-xs text-muted-foreground">${catStats.value.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle className="text-base sm:text-lg">
              Transactions {activeCategory !== "all" && `— ${BILLER_CATEGORIES[activeCategory]?.label}`}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search account, biller, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No bill payments found</p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 px-4">
                {filteredPayments.slice(0, 50).map((p) => (
                  <Card key={p.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{p.biller_name}</p>
                        <p className="text-xs text-muted-foreground">{p.account_number}</p>
                      </div>
                      {getStatusBadge(p.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">${Number(p.amount).toFixed(2)} {p.currency}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(p.created_at), "dd MMM yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {(p as any).reconRef}
                    </p>
                    {p.tokens && typeof p.tokens === "object" && (p.tokens as any).token && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                        Token: {(p.tokens as any).token}
                      </div>
                    )}
                    {p.transaction_reference && (
                      <p className="text-xs text-muted-foreground mt-1">Ref: {p.transaction_reference}</p>
                    )}
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Date</TableHead>
                       <TableHead>Recon Ref</TableHead>
                       <TableHead>Biller</TableHead>
                       <TableHead>Account</TableHead>
                       <TableHead className="text-right">Amount</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Payment Ref</TableHead>
                       <TableHead>Token/Details</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.slice(0, 100).map((p) => (
                      <TableRow key={p.id}>
                         <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(p.created_at), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {(p as any).reconRef}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.biller_name}</p>
                            <p className="text-xs text-muted-foreground">{p.biller_type}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{p.account_number}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${Number(p.amount).toFixed(2)}
                          <span className="text-xs text-muted-foreground ml-1">{p.currency}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {p.transaction_reference || "—"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px]">
                          {p.tokens && typeof p.tokens === "object" && (p.tokens as any).token ? (
                            <span className="font-mono text-xs break-all">{(p.tokens as any).token}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredPayments.length > 100 && (
                <p className="text-center text-sm text-muted-foreground py-3">
                  Showing 100 of {filteredPayments.length} results
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillReconciliation;
