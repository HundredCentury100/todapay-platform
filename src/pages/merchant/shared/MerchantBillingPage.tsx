import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Receipt,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Calendar,
} from "lucide-react";

interface Invoice {
  id: string;
  period: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  paidDate?: string;
}

const MerchantBillingPage = () => {
  const { convertPrice } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      // Mock invoices
      const mockInvoices: Invoice[] = [
        {
          id: "INV-2026-01",
          period: "January 2026",
          amount: 450,
          status: "pending",
          dueDate: "2026-02-05",
        },
        {
          id: "INV-2025-12",
          period: "December 2025",
          amount: 380,
          status: "paid",
          dueDate: "2026-01-05",
          paidDate: "2026-01-03",
        },
        {
          id: "INV-2025-11",
          period: "November 2025",
          amount: 420,
          status: "paid",
          dueDate: "2025-12-05",
          paidDate: "2025-12-01",
        },
      ];
      setInvoices(mockInvoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Invoice["status"]) => {
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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const pendingInvoice = invoices.find((i) => i.status !== "paid");
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Platform Fees & Billing</h1>
        <p className="text-sm text-muted-foreground">
          View and pay your platform invoices
        </p>
      </div>

      {/* Current Balance */}
      {pendingInvoice && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance Due</p>
                <p className="text-3xl font-bold">
                  {convertPrice(pendingInvoice.amount)}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  Due: {pendingInvoice.dueDate}
                </p>
              </div>
              <Button size="lg">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Paid (Year)</p>
            <p className="text-xl font-bold">{convertPrice(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Platform Fee Rate</p>
            <p className="text-xl font-bold">5%</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 flex items-center justify-between hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{invoice.id}</p>
                  <p className="text-xs text-muted-foreground">{invoice.period}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{convertPrice(invoice.amount)}</p>
                    {invoice.paidDate && (
                      <p className="text-xs text-muted-foreground">
                        Paid: {invoice.paidDate}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(invoice.status)}
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-2">Need help with billing?</p>
          <p className="text-sm text-muted-foreground">
            Contact our support team at billing@travela.co.zw or call +263 242 123
            456
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantBillingPage;
