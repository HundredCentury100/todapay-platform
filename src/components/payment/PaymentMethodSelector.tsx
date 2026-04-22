import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MerchantPaymentMethod, BankTransferConfig, MobileMoneyConfig, MobileMoneyProvider } from "@/types/payment";
import { Wallet, Building2, Smartphone, CreditCard, Upload, Phone } from "lucide-react";
import { paymentFormSchema } from "@/lib/validationSchemas";
import { toast } from "sonner";

interface PaymentMethodSelectorProps {
  paymentMethods: MerchantPaymentMethod[];
  onSelectMethod: (methodType: string, data: any) => void;
  loading?: boolean;
}

export default function PaymentMethodSelector({ paymentMethods, onSelectMethod, loading }: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");

  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);
    setPaymentProof(null);
    setTransactionRef("");
  };

  const handleSubmit = () => {
    const method = paymentMethods.find(m => m.payment_type === selectedMethod);
    if (!method) return;

    // Validate transaction reference if required
    if ((selectedMethod === "mobile_money" || selectedMethod === "bank_transfer") && transactionRef) {
      try {
        paymentFormSchema.parse({ transactionRef });
      } catch (error: any) {
        toast.error(error.errors?.[0]?.message || "Invalid transaction reference");
        return;
      }
    }

    onSelectMethod(selectedMethod, {
      paymentProof,
      transactionRef,
      configuration: method.configuration,
    });
  };

  const renderMethodDetails = () => {
    const method = paymentMethods.find(m => m.payment_type === selectedMethod);
    if (!method) return null;

    switch (selectedMethod) {
      case "cash":
        return (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              You will pay cash on delivery or at pickup. Please have the exact amount ready.
            </AlertDescription>
          </Alert>
        );

      case "bank_transfer":
        const bankConfig = method.configuration as BankTransferConfig;
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Bank:</span> {bankConfig.bank_name}
                </div>
                <div>
                  <span className="font-medium">Account Number:</span> {bankConfig.account_number}
                </div>
                <div>
                  <span className="font-medium">Account Name:</span> {bankConfig.account_name}
                </div>
                {bankConfig.swift_code && (
                  <div>
                    <span className="font-medium">SWIFT Code:</span> {bankConfig.swift_code}
                  </div>
                )}
                {bankConfig.instructions && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {bankConfig.instructions}
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="payment-proof">Upload Payment Proof *</Label>
              <Input
                id="payment-proof"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a screenshot or photo of your payment receipt
              </p>
            </div>

            <div>
              <Label htmlFor="transaction-ref">Transaction Reference</Label>
              <Input
                id="transaction-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter reference number from your bank"
              />
            </div>
          </div>
        );

      case "mobile_money":
        const mobileConfig = method.configuration as MobileMoneyConfig;
        
        // Map provider codes to display names
        const providerNames: Record<MobileMoneyProvider, string> = {
          'mpesa': 'M-Pesa',
          'mtn_money': 'MTN Money',
          'airtel_money': 'Airtel Money',
          'orange_money': 'Orange Money',
          'tigo_pesa': 'Tigo Pesa',
          'vodacom_mpesa': 'Vodacom M-Pesa',
          'ecocash': 'EcoCash',
          'moov_money': 'Moov Money',
          'wave': 'Wave',
          'chipper_cash': 'Chipper Cash',
          'telecash': 'TeleCash',
          'flooz': 'Flooz',
          'tmoney': 'T-Money',
          'omari': 'O\'mari',
        };
        
        // USSD codes for different providers
        const ussdCodes: Record<MobileMoneyProvider, string> = {
          'mpesa': `*334*1*${mobileConfig.business_number}#`,
          'mtn_money': `*165*1*${mobileConfig.business_number}#`,
          'airtel_money': `*432*1*${mobileConfig.business_number}#`,
          'orange_money': `*144*1*${mobileConfig.business_number}#`,
          'tigo_pesa': `*150*00*${mobileConfig.business_number}#`,
          'vodacom_mpesa': `*150*00*${mobileConfig.business_number}#`,
          'ecocash': `*151*1*${mobileConfig.business_number}#`,
          'moov_money': `*555*1*${mobileConfig.business_number}#`,
          'wave': '',
          'chipper_cash': '',
          'telecash': `*165*1*${mobileConfig.business_number}#`,
          'flooz': `*155*1*${mobileConfig.business_number}#`,
          'tmoney': `*144*1*${mobileConfig.business_number}#`,
          'omari': '',
        };
        
        const displayName = providerNames[mobileConfig.provider] || mobileConfig.provider;
        const ussdCode = ussdCodes[mobileConfig.provider] || mobileConfig.shortcode;
        
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{displayName} Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Provider:</span> {displayName}
                </div>
                {mobileConfig.countries && mobileConfig.countries.length > 0 && (
                  <div>
                    <span className="font-medium">Available in:</span> {mobileConfig.countries.join(', ')}
                  </div>
                )}
                <div>
                  <span className="font-medium">Business Number:</span> {mobileConfig.business_number}
                </div>
                <div>
                  <span className="font-medium">USSD Code:</span> <code className="px-2 py-1 bg-muted rounded">{ussdCode}</code>
                </div>
                {mobileConfig.instructions && (
                  <div className="text-sm text-muted-foreground">
                    {mobileConfig.instructions}
                  </div>
                )}
                {ussdCode && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `tel:${ussdCode}`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Dial {ussdCode}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="mobile-ref">Transaction Reference *</Label>
              <Input
                id="mobile-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter the transaction reference from your phone"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                After completing the mobile money payment, enter the confirmation code you received
              </p>
            </div>
          </div>
        );

      case "payment_gateway":
        return (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              You will be redirected to a secure payment page to complete your transaction.
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No payment methods available. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                <RadioGroupItem value={method.payment_type} id={method.payment_type} />
                <Label htmlFor={method.payment_type} className="flex items-center gap-2 cursor-pointer flex-1">
                  {method.payment_type === "cash" && <Wallet className="h-5 w-5" />}
                  {method.payment_type === "bank_transfer" && <Building2 className="h-5 w-5" />}
                  {method.payment_type === "mobile_money" && <Smartphone className="h-5 w-5" />}
                  {method.payment_type === "payment_gateway" && <CreditCard className="h-5 w-5" />}
                  <span className="capitalize">{method.payment_type.replace("_", " ")}</span>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {selectedMethod && (
        <div className="mt-6">
          {renderMethodDetails()}
        </div>
      )}

      {selectedMethod && (
        <Button
          onClick={handleSubmit}
          disabled={loading || (selectedMethod === "bank_transfer" && !paymentProof) || (selectedMethod === "mobile_money" && !transactionRef)}
          className="w-full"
        >
          {loading ? "Processing..." : "Confirm Payment"}
        </Button>
      )}
    </div>
  );
}
