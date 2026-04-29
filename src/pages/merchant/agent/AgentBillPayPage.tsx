import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UniversalBillReceipt } from "@/components/bills/UniversalBillReceipt";
import { getFloatAccount, deductAgentFloat } from "@/services/agentFloatService";
import { AgentFloatBalanceCard } from "@/components/agent/AgentFloatBalanceCard";
import {
  Zap, Droplets, Phone, Wifi, Heart, ShoppingBag, Moon, Search,
  Loader2, CheckCircle, AlertCircle, ArrowLeft, Receipt, AlertTriangle
} from "lucide-react";

const billers = [
  { id: "zesa", name: "ZESA", description: "Electricity tokens", icon: Zap, color: "text-yellow-600", bg: "bg-yellow-500/10", accountLabel: "Meter Number", placeholder: "e.g. 04123456789", maxLen: 13, inputMode: "numeric" as const, validate: (v: string) => /^\d{11,13}$/.test(v), supportsLookup: true },
  { id: "bcc", name: "BCC", description: "City of Bulawayo", icon: Droplets, color: "text-blue-600", bg: "bg-blue-500/10", accountLabel: "Account Number", placeholder: "e.g. 100012345", maxLen: 15, inputMode: "numeric" as const, validate: (v: string) => v.length >= 5, supportsLookup: true },
  { id: "econet", name: "Econet", description: "Airtime & data", icon: Phone, color: "text-red-600", bg: "bg-red-500/10", accountLabel: "Phone Number", placeholder: "e.g. 0771234567", maxLen: 10, inputMode: "tel" as const, validate: (v: string) => /^07[78]\d{7}$/.test(v), supportsLookup: false },
  { id: "netone", name: "NetOne", description: "Airtime & data", icon: Wifi, color: "text-green-600", bg: "bg-green-500/10", accountLabel: "Phone Number", placeholder: "e.g. 0711234567", maxLen: 10, inputMode: "tel" as const, validate: (v: string) => /^071\d{7}$/.test(v), supportsLookup: false },
  { id: "telecel", name: "Telecel", description: "Airtime & data", icon: Phone, color: "text-purple-600", bg: "bg-purple-500/10", accountLabel: "Phone Number", placeholder: "e.g. 0731234567", maxLen: 10, inputMode: "tel" as const, validate: (v: string) => /^073\d{7}$/.test(v), supportsLookup: false },
  { id: "nyaradzo", name: "Nyaradzo", description: "Funeral policy", icon: Heart, color: "text-pink-600", bg: "bg-pink-500/10", accountLabel: "Policy Number", placeholder: "e.g. NYR12345", maxLen: 20, inputMode: "text" as const, validate: (v: string) => v.length >= 4, supportsLookup: true },
  { id: "edgars", name: "Edgars", description: "Store account", icon: ShoppingBag, color: "text-orange-600", bg: "bg-orange-500/10", accountLabel: "Account Number", placeholder: "e.g. 1234567890", maxLen: 15, inputMode: "numeric" as const, validate: (v: string) => v.length >= 5, supportsLookup: true },
  { id: "jet", name: "Jet", description: "Store account", icon: ShoppingBag, color: "text-cyan-600", bg: "bg-cyan-500/10", accountLabel: "Account Number", placeholder: "e.g. 1234567890", maxLen: 15, inputMode: "numeric" as const, validate: (v: string) => v.length >= 5, supportsLookup: true },
  { id: "moonlight", name: "Moonlight", description: "Funeral policy", icon: Moon, color: "text-indigo-600", bg: "bg-indigo-500/10", accountLabel: "Policy Number", placeholder: "e.g. ML12345", maxLen: 20, inputMode: "text" as const, validate: (v: string) => v.length >= 4, supportsLookup: true },
];

type PaymentMethod = "cash" | "pos" | "toda_pay" | "omari" | "innbucks";

const paymentMethods: { value: PaymentMethod; label: string; highlighted?: boolean }[] = [
  { value: "cash", label: "Cash" },
  { value: "pos", label: "POS Terminal" },
  { value: "toda_pay", label: "TodaPay" },
  { value: "omari", label: "O'mari" },
  { value: "innbucks", label: "InnBucks", highlighted: true },
];

export default function AgentBillPayPage() {
  const { merchantProfile } = useMerchantAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isExternalAgent = merchantProfile?.role === 'booking_agent';

  const { data: floatAccount, refetch: refetchFloat } = useQuery({
    queryKey: ['agent-float-bill-pay', merchantProfile?.id],
    queryFn: () => merchantProfile ? getFloatAccount(merchantProfile.id) : Promise.resolve(null),
    enabled: !!merchantProfile?.id && isExternalAgent,
  });

  const [selectedBiller, setSelectedBiller] = useState<typeof billers[0] | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ZWG">("USD");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "form" | "confirm" | "receipt">("select");
  const [receiptData, setReceiptData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBillers = billers.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const amountNum = parseFloat(amount);
  const isAirtimeOrZesa = selectedBiller && ["zesa", "econet", "netone", "telecel"].includes(selectedBiller.id);
  const serviceFee = isAirtimeOrZesa ? 0 : 1;
  const totalAmount = !isNaN(amountNum) && amountNum > 0 ? amountNum + serviceFee : 0;

  const handleSelectBiller = (biller: typeof billers[0]) => {
    setSelectedBiller(biller);
    setAccountNumber("");
    setAmount("");
    setCustomerName("");
    setCustomerPhone("");
    setStep("form");
  };

  const handleContinueToConfirm = () => {
    if (!selectedBiller) return;
    if (!selectedBiller.validate(accountNumber)) {
      toast({ title: "Invalid Account", description: `Please enter a valid ${selectedBiller.accountLabel.toLowerCase()}`, variant: "destructive" });
      return;
    }
    if (isNaN(amountNum) || amountNum < 1) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount (min $1)", variant: "destructive" });
      return;
    }

    // Float check for external agents
    if (isExternalAgent && floatAccount) {
      const commissionRate = (merchantProfile?.commission_rate || 10) / 100;
      const netDeduction = amountNum - (amountNum * commissionRate);
      const availableBalance = currency === "USD" ? floatAccount.balance_usd : floatAccount.balance_zwg;
      if (availableBalance < netDeduction) {
        toast({
          title: "Insufficient Float",
          description: `Your ${currency} float balance (${availableBalance.toFixed(2)}) is insufficient. Net deduction required: ${netDeduction.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }
    }

    setStep("confirm");
  };

  const handleProcessPayment = async () => {
    if (!selectedBiller || !merchantProfile || !user) return;
    setLoading(true);

    const txRef = `AGT-${selectedBiller.id.toUpperCase()}-${Date.now()}`;
    const dateTime = new Date().toLocaleString();

    try {
      // Attempt eSolutions fulfillment
      let esolutionsResult: any = null;
      try {
        const { data, error } = await supabase.functions.invoke("esolutions-bill-pay", {
          body: { action: "pay", merchantId: selectedBiller.id, accountNumber, amount: amountNum, currency },
        });
        if (!error) esolutionsResult = data;
      } catch (err) {
        console.error("eSolutions fulfillment error:", err);
      }

      // Record in database with agent context
      await supabase.from("bill_payments").insert({
        user_id: user.id,
        biller_type: selectedBiller.id,
        biller_name: selectedBiller.name,
        account_number: accountNumber,
        amount: amountNum,
        currency,
        status: esolutionsResult?.success ? "completed" : "pending_fulfillment",
        transaction_reference: txRef,
        payment_method: paymentMethod,
        agent_profile_id: merchantProfile.id,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        metadata: {
          esolutions: esolutionsResult,
          agent_payment_method: paymentMethod,
          customer_name: customerName,
          customer_phone: customerPhone,
        },
        tokens: esolutionsResult?.tokens || null,
      } as any);

      // Deduct float for external agents
      if (isExternalAgent) {
        try {
          const commissionRate = (merchantProfile.commission_rate || 10) / 100;
          const netDeduction = amountNum - (amountNum * commissionRate);
          await deductAgentFloat(
            merchantProfile.id,
            netDeduction,
            currency,
            undefined,
            `${selectedBiller.name} payment - ${accountNumber} (Net: ${currency} ${netDeduction.toFixed(2)})`
          );
          refetchFloat();
        } catch (floatErr: any) {
          console.error("Float deduction error:", floatErr);
          // Payment already recorded, just warn
          toast({ title: "Float Deduction Warning", description: floatErr.message || "Float deduction failed but payment was recorded", variant: "destructive" });
        }
      }

      // Send notification to agent (SMS + email via edge function)
      try {
        await supabase.functions.invoke('send-agent-notification', {
          body: {
            agentProfileId: merchantProfile.id,
            notificationType: 'new_booking',
            title: `${selectedBiller.name} Payment Processed`,
            body: `${currency} ${amountNum.toFixed(2)} ${selectedBiller.name} payment for ${accountNumber}. Method: ${paymentMethod.replace("_", " ")}. Ref: ${txRef}`,
            data: {
              billerName: selectedBiller.name,
              accountNumber,
              amount: amountNum,
              currency,
              paymentMethod,
              transactionReference: txRef,
              customerName,
            },
          },
        });
      } catch (notifErr) {
        console.error("Agent notification error:", notifErr);
      }

      setReceiptData({
        reference: txRef,
        billerName: selectedBiller.name,
        billerType: selectedBiller.description,
        accountNumber,
        amount: amountNum,
        currency,
        paymentMethod,
        dateTime,
        tokens: esolutionsResult?.tokens,
        kwh: esolutionsResult?.kwh,
        customerName,
        customerPhone,
      });

      setStep("receipt");
      toast({ title: "Payment Processed!", description: `${selectedBiller.name} payment recorded successfully` });
    } catch (err: any) {
      console.error("Agent bill payment error:", err);
      toast({ title: "Payment Failed", description: err.message || "Could not process payment", variant: "destructive" });
    }

    setLoading(false);
  };

  const handleNewPayment = () => {
    setSelectedBiller(null);
    setAccountNumber("");
    setAmount("");
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("cash");
    setStep("select");
    setReceiptData(null);
  };

  if (step === "receipt" && receiptData) {
    return (
      <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Payment Receipt</h1>
          <Button onClick={handleNewPayment}>New Payment</Button>
        </div>
        <UniversalBillReceipt data={receiptData} onDone={handleNewPayment} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        {step !== "select" && (
          <Button variant="ghost" size="icon" onClick={() => setStep(step === "confirm" ? "form" : "select")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {step === "select" ? "Bill Payments" : step === "form" ? `Pay ${selectedBiller?.name}` : "Confirm Payment"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "select" ? "Select a biller to process payment" : step === "form" ? "Enter customer details" : "Review and confirm"}
          </p>
        </div>
      </div>

      {isExternalAgent && step === "select" && (
        <AgentFloatBalanceCard floatAccount={floatAccount || null} />
      )}

      {step === "select" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search billers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {filteredBillers.map((biller) => {
              const Icon = biller.icon;
              return (
                <Card
                  key={biller.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                  onClick={() => handleSelectBiller(biller)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className={`w-12 h-12 rounded-2xl ${biller.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${biller.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{biller.name}</p>
                      <p className="text-xs text-muted-foreground">{biller.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {step === "form" && selectedBiller && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                {(() => { const Icon = selectedBiller.icon; return (
                  <div className={`w-10 h-10 rounded-xl ${selectedBiller.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${selectedBiller.color}`} />
                  </div>
                ); })()}
                <div>
                  <p className="font-bold">{selectedBiller.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedBiller.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{selectedBiller.accountLabel}</Label>
                <Input
                  value={accountNumber}
                  onChange={(e) => {
                    const val = selectedBiller.inputMode === "numeric" || selectedBiller.inputMode === "tel"
                      ? e.target.value.replace(/\D/g, "").slice(0, selectedBiller.maxLen)
                      : e.target.value.slice(0, selectedBiller.maxLen);
                    setAccountNumber(val);
                  }}
                  placeholder={selectedBiller.placeholder}
                  inputMode={selectedBiller.inputMode}
                  className="font-mono"
                />
                {selectedBiller.validate(accountNumber) && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Valid
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Amount ({currency})</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "ZWG")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="ZWG">ZWG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Customer Details (Optional)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Phone</Label>
                    <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0771234567" inputMode="tel" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(pm => (
                      <SelectItem key={pm.value} value={pm.value} className={pm.highlighted ? "font-semibold text-[#00A651]" : ""}>
                        {pm.label}{pm.highlighted ? " ⚡" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleContinueToConfirm} className="w-full" disabled={!selectedBiller.validate(accountNumber) || isNaN(amountNum) || amountNum < 1}>
                Continue
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "confirm" && selectedBiller && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="text-center pb-3">
                <Receipt className="w-10 h-10 mx-auto text-primary mb-2" />
                <h3 className="font-bold text-lg">Confirm Payment</h3>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Biller</span><span className="font-semibold">{selectedBiller.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{selectedBiller.accountLabel}</span><span className="font-mono">{accountNumber}</span></div>
                {customerName && <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{customerName}</span></div>}
                {customerPhone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{customerPhone}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="capitalize">{paymentMethod.replace("_", " ")}</span></div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{currency} {amountNum.toFixed(2)}</span></div>
                  {serviceFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service Fee</span><span>{currency} {serviceFee.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-base mt-1"><span>Total</span><span>{currency} {totalAmount.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Back</Button>
                <Button className="flex-1" onClick={handleProcessPayment} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? "Processing..." : "Process Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
