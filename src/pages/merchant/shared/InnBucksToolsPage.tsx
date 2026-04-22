import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Phone, Search, Loader2, CheckCircle, AlertCircle,
  ArrowLeftRight, Banknote, FileText, RotateCcw, Coins
} from "lucide-react";

function ResultCard({ result, loading }: { result: any; loading: boolean }) {
  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Processing...
        </CardContent>
      </Card>
    );
  }
  if (!result) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          {result.success ? (
            <Badge className="bg-green-500/10 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" /> Success
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" /> Failed
            </Badge>
          )}
        </div>
        <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-60 whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

// ─── Utility Payments Tab ───
function UtilityPaymentsTab() {
  const { toast } = useToast();
  const [provider, setProvider] = useState("ECONET");
  const [product, setProduct] = useState("AIRTIME");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const providers = [
    { value: "ECONET", label: "Econet" },
    { value: "NETONE", label: "NetOne" },
    { value: "TELECEL", label: "Telecel" },
    { value: "ZESA", label: "ZESA" },
  ];

  const products: Record<string, { value: string; label: string }[]> = {
    ECONET: [{ value: "AIRTIME", label: "Airtime" }, { value: "DATA", label: "Data Bundle" }],
    NETONE: [{ value: "AIRTIME", label: "Airtime" }, { value: "DATA", label: "Data Bundle" }],
    TELECEL: [{ value: "AIRTIME", label: "Airtime" }, { value: "DATA", label: "Data Bundle" }],
    ZESA: [{ value: "PREPAID", label: "Prepaid Token" }],
  };

  const handleSubmit = async () => {
    if (!account || !amount) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: {
          action: "utilityPayment",
          provider,
          providerProduct: product,
          amount: parseFloat(amount),
          currency,
          reference: `UTL-${Date.now()}`,
          narration: `${provider} ${product} purchase`,
          destinationAccount: account,
        },
      });
      if (error) throw error;
      setResult(data);
      if (data?.success) toast({ title: "Payment Successful", description: `${provider} ${product} processed` });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00A651]" /> Utility Payments via InnBucks
          </CardTitle>
          <CardDescription>Process airtime, data, and ZESA payments through InnBucks Merchant API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => { setProvider(v); setProduct(products[v]?.[0]?.value || ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(products[provider] || []).map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{provider === "ZESA" ? "Meter Number" : "Phone Number"}</Label>
            <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={provider === "ZESA" ? "04123456789" : "0771234567"} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min={0.5} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZWG">ZWG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={loading || !account || !amount} className="w-full bg-[#00A651] hover:bg-[#008C45] text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Process Payment
          </Button>
        </CardContent>
      </Card>
      <ResultCard result={result} loading={loading} />
    </div>
  );
}

// ─── Account Inquiry Tab ───
function AccountInquiryTab() {
  const { toast } = useToast();
  const [msisdn, setMsisdn] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLookup = async () => {
    if (!msisdn) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: { action: "linkedAccountInquiry", msisdn },
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast({ title: "Lookup Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5" /> Account Inquiry
          </CardTitle>
          <CardDescription>Look up a customer's InnBucks account by phone number (MSISDN)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number (MSISDN)</Label>
            <Input value={msisdn} onChange={(e) => setMsisdn(e.target.value)} placeholder="e.g. 263771234567" inputMode="tel" />
          </div>
          <Button onClick={handleLookup} disabled={loading || !msisdn} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Look Up Account
          </Button>
        </CardContent>
      </Card>
      <ResultCard result={result} loading={loading} />
    </div>
  );
}

// ─── Send Change Tab ───
function SendChangeTab() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!phone || isNaN(amt) || amt <= 0 || amt > 5) {
      toast({ title: "Invalid Input", description: "Amount must be between $0.01 and $5.00", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: {
          action: "bankChange",
          reference: `CHG-${Date.now()}`,
          amount: amt,
          currency,
          narration: narration || "Digital change",
          destinationMsisdn: phone,
        },
      });
      if (error) throw error;
      setResult(data);
      if (data?.success) toast({ title: "Change Sent", description: `${currency} ${amt.toFixed(2)} sent successfully` });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5" /> Send Digital Change
          </CardTitle>
          <CardDescription>Send change up to $5 to a customer's InnBucks account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Customer Phone (MSISDN)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 263771234567" inputMode="tel" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount (max $5.00)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" max={5} min={0.01} step={0.01} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZWG">ZWG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Narration (optional)</Label>
            <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Change for purchase" />
          </div>
          <Button onClick={handleSend} disabled={loading || !phone || !amount} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Coins className="w-4 h-4 mr-2" />}
            Send Change
          </Button>
        </CardContent>
      </Card>
      <ResultCard result={result} loading={loading} />
    </div>
  );
}

// ─── Deposit Tab ───
function DepositTab() {
  const { toast } = useToast();
  const [destAccount, setDestAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDeposit = async () => {
    if (!destAccount || !amount) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: {
          action: "deposit",
          reference: `DEP-${Date.now()}`,
          amount: parseFloat(amount),
          currency,
          narration: narration || "Deposit",
          destinationAccount: destAccount,
        },
      });
      if (error) throw error;
      setResult(data);
      if (data?.success) toast({ title: "Deposit Successful" });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast({ title: "Deposit Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="w-5 h-5" /> Account Deposit
          </CardTitle>
          <CardDescription>Send money to an InnBucks account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Destination Account</Label>
            <Input value={destAccount} onChange={(e) => setDestAccount(e.target.value)} placeholder="Account number" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min={0.01} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZWG">ZWG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Narration (optional)</Label>
            <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Payout" />
          </div>
          <Button onClick={handleDeposit} disabled={loading || !destAccount || !amount} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Banknote className="w-4 h-4 mr-2" />}
            Send Deposit
          </Button>
        </CardContent>
      </Card>
      <ResultCard result={result} loading={loading} />
    </div>
  );
}

// ─── Statement Tab ───
function StatementTab() {
  const { toast } = useToast();
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: {
          action: "statement",
          currency,
          startDateTime: new Date(startDate).toISOString(),
          endDateTime: new Date(endDate).toISOString(),
        },
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" /> Account Statement
          </CardTitle>
          <CardDescription>View account transaction history for a date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="ZWG">ZWG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleFetch} disabled={loading || !startDate || !endDate} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            Fetch Statement
          </Button>
        </CardContent>
      </Card>
      <ResultCard result={result} loading={loading} />
    </div>
  );
}

// ─── Reversal Tab ───
function ReversalTab() {
  const { toast } = useToast();
  const [originalRef, setOriginalRef] = useState("");
  const [participantRef, setParticipantRef] = useState("");
  const [destAccount, setDestAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleReverse = async () => {
    if (!originalRef || !amount || !destAccount) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: {
          action: "reversal",
          amount: parseFloat(amount),
          currency,
          destinationAccount: destAccount,
          participantReference: participantRef || `REV-${Date.now()}`,
          originalParticipantReference: originalRef,
        },
      });
      if (error) throw error;
      setResult(data);
      if (data?.success) toast({ title: "Reversal Successful" });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast({ title: "Reversal Failed", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RotateCcw className="w-5 h-5" /> Transaction Reversal
          </CardTitle>
          <CardDescription>Reverse a previous deposit transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Original Participant Reference</Label>
            <Input value={originalRef} onChange={(e) => setOriginalRef(e.target.value)} placeholder="Original transaction reference" />
          </div>
          <div className="space-y-2">
            <Label>Destination Account</Label>
            <Input value={destAccount} onChange={(e) => setDestAccount(e.target.value)} placeholder="Account number" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min={0.01} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZWG">ZWG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>New Participant Reference (optional)</Label>
            <Input value={participantRef} onChange={(e) => setParticipantRef(e.target.value)} placeholder="Auto-generated if empty" />
          </div>
          <Button onClick={handleReverse} disabled={loading || !originalRef || !amount || !destAccount} variant="destructive" className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Reverse Transaction
          </Button>
        </CardContent>
      </Card>
      <ResultCard result={result} loading={loading} />
    </div>
  );
}

// ─── Main Page ───
export default function InnBucksToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#00A651]/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#00A651]" />
          </div>
          InnBucks Merchant Tools
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage utility payments, deposits, account inquiries, and more via InnBucks Merchant API
        </p>
      </div>

      <Tabs defaultValue="utility" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="utility" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Zap className="w-3.5 h-3.5" /> Utilities
          </TabsTrigger>
          <TabsTrigger value="inquiry" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Search className="w-3.5 h-3.5" /> Inquiry
          </TabsTrigger>
          <TabsTrigger value="change" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Coins className="w-3.5 h-3.5" /> Change
          </TabsTrigger>
          <TabsTrigger value="deposit" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Banknote className="w-3.5 h-3.5" /> Deposit
          </TabsTrigger>
          <TabsTrigger value="statement" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" /> Statement
          </TabsTrigger>
          <TabsTrigger value="reversal" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Reversal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="utility"><UtilityPaymentsTab /></TabsContent>
        <TabsContent value="inquiry"><AccountInquiryTab /></TabsContent>
        <TabsContent value="change"><SendChangeTab /></TabsContent>
        <TabsContent value="deposit"><DepositTab /></TabsContent>
        <TabsContent value="statement"><StatementTab /></TabsContent>
        <TabsContent value="reversal"><ReversalTab /></TabsContent>
      </Tabs>
    </div>
  );
}
