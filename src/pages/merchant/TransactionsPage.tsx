import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getTransactionsByMerchant } from "@/services/paymentService";
import { toast } from "sonner";
import { Download, Eye, Loader2, DollarSign, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/utils/exportData";

export default function TransactionsPage() {
  const { merchantProfile } = useMerchantAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalFees: 0,
    netRevenue: 0,
    completedCount: 0,
  });

  useEffect(() => {
    if (merchantProfile) {
      loadTransactions();
    }
  }, [merchantProfile]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, statusFilter, dateFilter]);

  const loadTransactions = async () => {
    if (!merchantProfile) return;
    try {
      const data = await getTransactionsByMerchant(merchantProfile.id);
      setTransactions(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const totalRevenue = data.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalFees = data.reduce((sum, t) => sum + parseFloat(t.platform_fee_amount), 0);
    const netRevenue = data.reduce((sum, t) => sum + parseFloat(t.merchant_amount), 0);
    const completedCount = data.filter(t => t.payment_status === 'completed').length;

    setStats({ totalRevenue, totalFees, netRevenue, completedCount });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.transaction_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.bookings?.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.bookings?.passenger_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.payment_status === statusFilter);
    }

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
      
      filtered = filtered.filter(t => new Date(t.created_at) >= filterDate);
    }

    setFilteredTransactions(filtered);
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(txn => ({
      'Date': format(new Date(txn.created_at), 'yyyy-MM-dd HH:mm'),
      'Transaction Ref': txn.transaction_reference,
      'Booking Ref': txn.bookings?.booking_reference || 'N/A',
      'Customer': txn.bookings?.passenger_name || 'N/A',
      'Amount': `$${txn.amount.toFixed(2)}`,
      'Platform Fee': `$${txn.platform_fee_amount.toFixed(2)}`,
      'Your Amount': `$${txn.merchant_amount.toFixed(2)}`,
      'Method': txn.payment_method,
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
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Verifying</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
        <p className="text-sm md:text-base text-muted-foreground">View all your payment transactions and revenue breakdown</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{stats.completedCount} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${stats.totalFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Paid to platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.netRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">After platform fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue > 0 ? ((stats.totalFees / stats.totalRevenue) * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Average platform fee</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History ({filteredTransactions.length})</CardTitle>
              <CardDescription>All payment transactions for your bookings</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction Ref</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Your Amount</TableHead>
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
                    <TableCell className="text-sm">
                      {format(new Date(txn.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{txn.transaction_reference}</TableCell>
                    <TableCell className="font-mono text-xs">{txn.bookings?.booking_reference}</TableCell>
                    <TableCell className="text-sm">{txn.bookings?.passenger_name}</TableCell>
                    <TableCell className="font-semibold">${txn.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-primary">${txn.platform_fee_amount.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-green-600">${txn.merchant_amount.toFixed(2)}</TableCell>
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
                <h4 className="font-semibold mb-3">Revenue Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Transaction Amount:</span>
                    <span className="font-semibold">${selectedTransaction.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Platform Fee ({selectedTransaction.platform_fee_percentage}%):</span>
                    <span className="font-semibold">${selectedTransaction.platform_fee_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 text-lg font-bold">
                    <span>Your Amount:</span>
                    <span>${selectedTransaction.merchant_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Customer Details</h4>
                <div>
                  <p className="font-medium">{selectedTransaction.bookings?.passenger_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.bookings?.passenger_email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Booking: {selectedTransaction.bookings?.booking_reference}
                  </p>
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
