import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Receipt, Eye } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UniversalBillReceipt } from "@/components/bills/UniversalBillReceipt";

export default function AgentBillHistory() {
  const { merchantProfile } = useMerchantAuth();
  const [search, setSearch] = useState("");
  const [billerFilter, setBillerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['agent-bill-history', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      const { data, error } = await supabase
        .from("bill_payments")
        .select("*")
        .eq("agent_profile_id", merchantProfile.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const filtered = payments.filter((p: any) => {
    const matchesSearch = !search ||
      p.account_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.biller_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.transaction_reference?.toLowerCase().includes(search.toLowerCase()) ||
      (p.customer_name as string)?.toLowerCase().includes(search.toLowerCase());
    const matchesBiller = billerFilter === "all" || p.biller_type === billerFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesBiller && matchesStatus;
  });

  const uniqueBillers = [...new Set(payments.map((p: any) => p.biller_type))];

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending_fulfillment": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Biller", "Account", "Customer", "Amount", "Currency", "Method", "Status", "Reference"];
    const rows = filtered.map((p: any) => [
      format(new Date(p.created_at), "yyyy-MM-dd HH:mm"),
      p.biller_name, p.account_number, (p as any).customer_name || "",
      p.amount, p.currency, p.payment_method, p.status, p.transaction_reference,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bill-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Bill Payment History</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} transactions found</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by account, biller, customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={billerFilter} onValueChange={setBillerFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Billers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Billers</SelectItem>
            {uniqueBillers.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending_fulfillment">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No bill payments found</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((payment: any) => (
            <Card key={payment.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{payment.biller_name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{payment.account_number}</p>
                      {(payment as any).customer_name && (
                        <p className="text-xs text-muted-foreground truncate">{(payment as any).customer_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <p className="font-bold text-sm">{payment.currency} {payment.amount?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(payment.created_at), "dd MMM, HH:mm")}</p>
                      <Badge variant={statusColor(payment.status)} className="text-[10px] mt-1">{payment.status}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPayment(payment)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <UniversalBillReceipt
              data={{
                reference: selectedPayment.transaction_reference,
                billerName: selectedPayment.biller_name,
                billerType: selectedPayment.biller_type,
                accountNumber: selectedPayment.account_number,
                amount: selectedPayment.amount,
                currency: selectedPayment.currency,
                paymentMethod: selectedPayment.payment_method,
                dateTime: format(new Date(selectedPayment.created_at), "PPpp"),
                tokens: selectedPayment.tokens,
              }}
              onDone={() => setSelectedPayment(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
