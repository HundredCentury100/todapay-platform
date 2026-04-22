import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Phone,
  User,
  Calendar,
  Eye,
} from "lucide-react";

interface PendingPayment {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  method: string;
  submittedAt: string;
  proofUrl?: string;
}

const PaymentVerification = () => {
  const { convertPrice } = useCurrency();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      // Mock data
      const mockPayments: PendingPayment[] = [
        {
          id: "1",
          reference: "EC-2026012901",
          customerName: "John Moyo",
          customerPhone: "+263 77 123 4567",
          amount: 45,
          method: "Suvat Pay",
          submittedAt: "2026-01-29 10:30",
        },
        {
          id: "2",
          reference: "IK-2026012902",
          customerName: "Sarah Ncube",
          customerPhone: "+263 71 987 6543",
          amount: 120,
          method: "InnBucks",
          submittedAt: "2026-01-29 09:15",
        },
        {
          id: "3",
          reference: "OM-2026012903",
          customerName: "Tendai Chieza",
          customerPhone: "+263 73 555 1234",
          amount: 75,
          method: "OneMoney",
          submittedAt: "2026-01-29 08:45",
        },
      ];
      setPayments(mockPayments);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success("Payment verified successfully");
  };

  const handleReject = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.error("Payment rejected");
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payment Verification</h1>
        <p className="text-sm text-muted-foreground">
          Verify pending mobile money and manual payments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{payments.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {convertPrice(payments.reduce((sum, p) => sum + p.amount, 0))}
            </p>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">~5 min</p>
            <p className="text-xs text-muted-foreground">Avg Wait Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No pending payments to verify
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{payment.method}</Badge>
                      <span className="text-sm font-mono text-muted-foreground">
                        {payment.reference}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {payment.customerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {payment.customerPhone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Submitted: {payment.submittedAt}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3">
                    <p className="text-xl font-bold">
                      {convertPrice(payment.amount)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(payment.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleVerify(payment.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;
