import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  Loader2,
  Shield,
} from "lucide-react";

const MerchantPaymentPortalPage = () => {
  const { convertPrice } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState("toda_pay");
  const [processing, setProcessing] = useState(false);
  const [amount] = useState(450); // Current balance due

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment
    await new Promise((r) => setTimeout(r, 2000));
    setProcessing(false);
    toast.success("Payment submitted successfully!", {
      description: "Your payment will be verified within 24 hours.",
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payment Portal</h1>
        <p className="text-sm text-muted-foreground">
          Pay your platform fees securely
        </p>
      </div>

      {/* Amount Due */}
      <Card className="border-primary">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Amount Due</p>
          <p className="text-4xl font-bold mt-1">{convertPrice(amount)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Invoice #INV-2026-01 • Due: Feb 5, 2026
          </p>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  paymentMethod === "toda_pay"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="toda_pay" />
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">TodaPay</p>
                  <p className="text-xs text-muted-foreground">Pay via Pesepay gateway</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  paymentMethod === "omari"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="omari" />
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-sm">O'mari</p>
                  <p className="text-xs text-muted-foreground">Pay via Old Mutual wallet</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  paymentMethod === "bank"
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="bank" />
                <Building2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">Direct bank payment</p>
                </div>
              </label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Details */}
      {paymentMethod === "toda_pay" || paymentMethod === "omari" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="+263 77 123 4567" />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Payment Instructions:</p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>1. You will receive a payment prompt on your phone</li>
                <li>2. Enter merchant code: <span className="font-mono">12345</span></li>
                <li>3. Enter amount: {convertPrice(amount)}</li>
                <li>4. Confirm and enter PIN</li>
              </ol>
              <a
                href="tel:*153*2*2*052736%23"
                className="mt-3 flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors"
              >
                <Smartphone className="h-4 w-4" />
                Dial *153*2*2*052736#
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank Transfer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Name</span>
                <span className="font-medium">CBZ Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name</span>
                <span className="font-medium">Travela Pvt Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono">1234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono">INV-2026-01</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handlePayment}
        disabled={processing}
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Payment
          </>
        )}
      </Button>

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
        <Shield className="h-4 w-4" />
        <span>Payments are secure and encrypted</span>
      </div>
    </div>
  );
};

export default MerchantPaymentPortalPage;
