import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Receipt,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
} from "lucide-react";

interface MerchantBill {
  id: string;
  merchantName: string;
  amount: number;
  period: string;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
}

const MerchantBilling = () => {
  const { convertPrice } = useCurrency();
  const [bills, setBills] = useState<MerchantBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      // Mock data - in production, fetch from billing tables
      const mockBills: MerchantBill[] = [
        {
          id: "1",
          merchantName: "Intercape Zimbabwe",
          amount: 2500,
          period: "January 2026",
          status: "pending",
          dueDate: "2026-02-05",
        },
        {
          id: "2",
          merchantName: "HIFA Events",
          amount: 1800,
          period: "January 2026",
          status: "paid",
          dueDate: "2026-02-01",
        },
        {
          id: "3",
          merchantName: "Rainbow Towers",
          amount: 3200,
          period: "December 2025",
          status: "overdue",
          dueDate: "2026-01-15",
        },
      ];
      setBills(mockBills);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: MerchantBill["status"]) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
    }
  };

  const filteredBills = bills.filter((bill) =>
    bill.merchantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const totalPending = bills
    .filter((b) => b.status !== "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Merchant Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage platform fees and merchant invoices
          </p>
        </div>
        <Button>
          <Receipt className="h-4 w-4 mr-2" />
          Generate Invoices
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{bills.length}</p>
            <p className="text-xs text-muted-foreground">Total Merchants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {bills.filter((b) => b.status === "paid").length}
            </p>
            <p className="text-xs text-muted-foreground">Paid This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-600">
              {bills.filter((b) => b.status === "pending").length}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{convertPrice(totalPending)}</p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search merchants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Bills</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{bill.merchantName}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.period} • Due: {bill.dueDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{convertPrice(bill.amount)}</p>
                  {getStatusBadge(bill.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantBilling;
