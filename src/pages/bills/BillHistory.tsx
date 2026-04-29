import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Receipt, Clock, CheckCircle, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MobileAppLayout from "@/components/MobileAppLayout";
import { UniversalBillReceipt } from "@/components/bills/UniversalBillReceipt";

interface BillPaymentRow {
  id: string;
  biller_type: string;
  biller_name: string;
  account_number: string;
  amount: number;
  currency: string;
  status: string;
  transaction_reference: string | null;
  payment_method: string | null;
  tokens: any;
  metadata: any;
  created_at: string;
}

const BillHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<BillPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<BillPaymentRow | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setPayments(data as BillPaymentRow[]);
      }
      setLoading(false);
    };
    fetchPayments();
  }, [user]);

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "pending_fulfillment") return <Clock className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  const getStatusLabel = (status: string) => {
    if (status === "completed") return "Completed";
    if (status === "pending_fulfillment") return "Pending";
    return "Failed";
  };

  if (selectedPayment) {
    const tokens = selectedPayment.tokens?.tokens || selectedPayment.tokens;
    const meta = selectedPayment.metadata?.esolutions;

    const receiptData = {
      reference: selectedPayment.transaction_reference || selectedPayment.id,
      billerName: selectedPayment.biller_name,
      billerType: selectedPayment.biller_type,
      accountNumber: selectedPayment.account_number,
      amount: selectedPayment.amount,
      currency: selectedPayment.currency,
      paymentMethod: selectedPayment.payment_method || "toda_pay",
      dateTime: new Date(selectedPayment.created_at).toLocaleString(),
      tokens: Array.isArray(tokens) ? tokens : undefined,
      kwh: meta?.kwh,
      energyCharge: meta?.energyCharge,
      debt: meta?.debt,
      reaLevy: meta?.reaLevy,
      vat: meta?.vat,
    };

    return (
      <MobileAppLayout>
        <div className="min-h-screen bg-background pb-24">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 bg-background border-b safe-area-pt px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedPayment(null)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg">Receipt</h1>
            </div>
          </motion.header>
          <main className="px-4 py-5">
            <UniversalBillReceipt data={receiptData} onDone={() => setSelectedPayment(null)} />
          </main>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-background border-b safe-area-pt px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Link to="/pay/bills" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center tap-target">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Payment History</h1>
                <p className="text-xs text-muted-foreground">Your bill payments</p>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="px-4 py-5 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && payments.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No bill payments yet</p>
              <Button onClick={() => navigate("/pay/bills")} className="rounded-full">
                Pay a Bill
              </Button>
            </div>
          )}

          {!loading && payments.map((payment, idx) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card
                className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPayment(payment)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{payment.biller_name}</p>
                      {getStatusIcon(payment.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {payment.account_number} · {getStatusLabel(payment.status)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{payment.currency} {payment.amount.toFixed(2)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default BillHistory;
