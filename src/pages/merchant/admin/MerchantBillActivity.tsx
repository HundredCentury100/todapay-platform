import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, RefreshCw, Receipt, CheckCircle, Clock, XCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BillActivity {
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

const MerchantBillActivity = () => {
  const [activities, setActivities] = useState<BillActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let query = supabase.from("bill_payments").select("*").order("created_at", { ascending: false }).limit(500);
      if (dateRange.start) query = query.gte("created_at", dateRange.start);
      if (dateRange.end) query = query.lte("created_at", dateRange.end + "T23:59:59");
      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load bill activities");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(); }, []);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.account_number.toLowerCase().includes(q) || a.biller_name.toLowerCase().includes(q) || (a.transaction_reference || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [activities, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const completed = activities.filter(a => a.status === "completed");
    return {
      total: activities.length,
      completed: completed.length,
      pending: activities.filter(a => a.status === "pending").length,
      failed: activities.filter(a => a.status === "failed").length,
      totalValue: completed.reduce((s, a) => s + Number(a.amount), 0),
    };
  }, [activities]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      completed: { icon: CheckCircle, variant: "default" },
      pending: { icon: Clock, variant: "secondary" },
      failed: { icon: XCircle, variant: "destructive" },
    };
    const config = map[status] || { icon: AlertTriangle, variant: "outline" as const };
    const Icon = config.icon;
    return <Badge variant={config.variant}><Icon className="h-3 w-3 mr-1" />{status}</Badge>;
  };

  const exportCSV = () => {
    const headers = ["Date", "Biller", "Type", "Account", "Amount", "Currency", "Status", "Reference"];
    const rows = filtered.map(a => [
      format(new Date(a.created_at), "yyyy-MM-dd HH:mm"), a.biller_name, a.biller_type,
      a.account_number, a.amount, a.currency, a.status, a.transaction_reference || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bill-activity-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Merchant Bill Activity</h1>
          <p className="text-sm text-muted-foreground">Track all merchant bill payment transactions across ZESA, BCC, airtime, and more</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 sm:p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4"><p className="text-xs text-muted-foreground">Value</p><p className="text-xl font-bold">${stats.totalValue.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4"><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold text-primary">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4"><p className="text-xs text-muted-foreground">Failed</p><p className="text-xl font-bold text-destructive">{stats.failed}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Bill Transactions</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-none sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className="w-[140px]" placeholder="From" />
              <Input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className="w-[140px]" placeholder="To" />
              {(dateRange.start || dateRange.end) && <Button size="sm" onClick={fetchActivities}>Apply</Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No transactions found</p>
          ) : (
            <>
              <div className="sm:hidden space-y-3 px-4">
                {filtered.slice(0, 50).map(a => (
                  <Card key={a.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{a.biller_name}</p>
                        <p className="text-xs text-muted-foreground">{a.account_number}</p>
                      </div>
                      {getStatusBadge(a.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">${Number(a.amount).toFixed(2)} {a.currency}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd MMM yyyy HH:mm")}</span>
                    </div>
                    {a.transaction_reference && <p className="text-xs text-muted-foreground mt-1">Ref: {a.transaction_reference}</p>}
                  </Card>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead><TableHead>Biller</TableHead><TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead><TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm whitespace-nowrap">{format(new Date(a.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell><p className="font-medium text-sm">{a.biller_name}</p><p className="text-xs text-muted-foreground">{a.biller_type}</p></TableCell>
                        <TableCell className="font-mono text-sm">{a.account_number}</TableCell>
                        <TableCell className="text-right font-semibold">${Number(a.amount).toFixed(2)} <span className="text-xs text-muted-foreground">{a.currency}</span></TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{a.transaction_reference || "—"}</TableCell>
                        <TableCell className="text-xs">{a.payment_method || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filtered.length > 100 && <p className="text-center text-sm text-muted-foreground py-3">Showing 100 of {filtered.length}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantBillActivity;
