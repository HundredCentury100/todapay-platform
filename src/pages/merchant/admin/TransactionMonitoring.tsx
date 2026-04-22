import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { updateTransactionStatus } from "@/services/paymentService";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Download, Filter, RefreshCw, Loader2, Activity, Eye } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/utils/exportData";

interface Transaction {
  id: string;
  transaction_reference: string;
  amount: number;
  platform_fee_amount: number;
  merchant_amount: number;
  payment_method: string;
  payment_status: string;
  payment_proof_url?: string;
  created_at: string;
  bookings?: {
    booking_reference: string;
    passenger_name: string;
    passenger_email: string;
  };
  merchant_profiles?: {
    business_name: string;
    business_email: string;
  };
}

export default function TransactionMonitoring() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    totalAmount: 0,
    totalFees: 0,
  });

  useEffect(() => {
    loadTransactions();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, statusFilter, methodFilter, dateFilter]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          bookings(booking_reference, passenger_name, passenger_email),
          merchant_profiles!transactions_merchant_profile_id_fkey(business_name, business_email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data as any || []);
      calculateStats(data as any || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction updated:', payload);
          loadTransactions(); // Reload all transactions
          toast.info("Transaction list updated", {
            icon: <Activity className="h-4 w-4" />
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateStats = (data: Transaction[]) => {
    const total = data.length;
    const pending = data.filter(t => t.payment_status === 'pending' || t.payment_status === 'pending_verification').length;
    const completed = data.filter(t => t.payment_status === 'completed').length;
    const failed = data.filter(t => t.payment_status === 'failed').length;
    const totalAmount = data.reduce((sum, t) => sum + parseFloat(t.amount as any), 0);
    const totalFees = data.reduce((sum, t) => sum + parseFloat(t.platform_fee_amount as any), 0);

    setStats({ total, pending, completed, failed, totalAmount, totalFees });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.transaction_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.bookings?.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.bookings?.passenger_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.merchant_profiles?.business_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.payment_status === statusFilter);
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter(t => t.payment_method === methodFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      if (dateFilter !== "all") {
        filtered = filtered.filter(t => new Date(t.created_at) >= filterDate);
      }
    }

    setFilteredTransactions(filtered);
  };

  const handleBulkVerify = async (approve: boolean) => {
    if (selectedTransactions.length === 0) {
      toast.error("No transactions selected");
      return;
    }

    setProcessing(true);
    try {
      const promises = selectedTransactions.map(txnId =>
        updateTransactionStatus(txnId, approve ? 'completed' : 'failed')
      );

      await Promise.all(promises);
      toast.success(`${selectedTransactions.length} transaction(s) ${approve ? 'approved' : 'rejected'}`);
      setSelectedTransactions([]);
      await loadTransactions();
    } catch (error) {
      console.error("Error processing bulk action:", error);
      toast.error("Failed to process transactions");
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(txn => ({
      'Transaction Ref': txn.transaction_reference,
      'Date': format(new Date(txn.created_at), 'yyyy-MM-dd HH:mm'),
      'Merchant': txn.merchant_profiles?.business_name || 'N/A',
      'Customer': txn.bookings?.passenger_name || 'N/A',
      'Booking Ref': txn.bookings?.booking_reference || 'N/A',
      'Amount': `$${txn.amount.toFixed(2)}`,
      'Platform Fee': `$${txn.platform_fee_amount.toFixed(2)}`,
      'Merchant Amount': `$${txn.merchant_amount.toFixed(2)}`,
      'Payment Method': txn.payment_method,
      'Status': txn.payment_status,
    }));

    exportToCSV(exportData, `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success("Transactions exported successfully");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
      case "pending_verification":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Pending Verification</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (txnId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, txnId]);
    } else {
      setSelectedTransactions(selectedTransactions.filter(id => id !== txnId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Transaction Monitoring</h1>
          <p className="text-sm md:text-base text-muted-foreground">Real-time transaction feed and verification</p>
        </div>
        <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${stats.totalFees.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedTransactions.length} transaction(s) selected</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTransactions([])}
                  disabled={processing}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleBulkVerify(false)}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Selected
                </Button>
                <Button
                  onClick={() => handleBulkVerify(true)}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
              <CardDescription>Real-time transaction monitoring</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Transaction Ref</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.includes(txn.id)}
                        onCheckedChange={(checked) => handleSelectTransaction(txn.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(txn.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{txn.transaction_reference}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {txn.merchant_profiles?.business_name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{txn.bookings?.passenger_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{txn.bookings?.booking_reference}</div>
                    </TableCell>
                    <TableCell className="font-semibold">${txn.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-primary">${txn.platform_fee_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{txn.payment_method}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(txn.payment_status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedTransaction(txn)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Reference</p>
                  <p className="font-mono">{selectedTransaction.transaction_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTransaction.payment_status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>{format(new Date(selectedTransaction.created_at), "PPpp")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="capitalize">{selectedTransaction.payment_method.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Financial Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Transaction Amount:</span>
                    <span className="font-semibold">${selectedTransaction.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Platform Fee:</span>
                    <span className="font-semibold">${selectedTransaction.platform_fee_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Merchant Amount:</span>
                    <span className="font-semibold">${selectedTransaction.merchant_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Parties Involved</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Merchant</p>
                    <p>{selectedTransaction.merchant_profiles?.business_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTransaction.merchant_profiles?.business_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p>{selectedTransaction.bookings?.passenger_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTransaction.bookings?.passenger_email}</p>
                  </div>
                </div>
              </div>

              {selectedTransaction.payment_proof_url && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>
                  <img
                    src={selectedTransaction.payment_proof_url}
                    alt="Payment proof"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
