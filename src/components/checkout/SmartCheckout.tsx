import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MerchantPaymentMethod, BankTransferConfig, MobileMoneyConfig, MobileMoneyProvider } from "@/types/payment";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { 
  Wallet, 
  Building2, 
  Smartphone, 
  CreditCard, 
  MessageCircle, 
  Shield, 
  Clock,
  Zap,
  ChevronRight,
  CheckCircle2,
  Info,
  Upload,
  Phone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentFormSchema } from "@/lib/validationSchemas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SmartCheckoutProps {
  paymentMethods: MerchantPaymentMethod[];
  bookingData: {
    itemName: string;
    from?: string;
    to?: string;
    date?: string;
    totalPrice: number;
    selectedSeats?: string[];
    ticketQuantity?: number;
    type: 'bus' | 'event';
    operator?: string;
  };
  onConfirmPayment: (methodType: string, data: any) => void;
  loading?: boolean;
  merchantWhatsApp?: string;
}

export function SmartCheckout({ 
  paymentMethods, 
  bookingData, 
  onConfirmPayment, 
  loading,
  merchantWhatsApp 
}: SmartCheckoutProps) {
  const { convertPrice } = useCurrency();
  const { userCountry } = useUserLocation();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [expandedSection, setExpandedSection] = useState<string>("recommended");

  // Get recommended payment methods based on region
  const getRecommendedMethods = () => {
    const recommendations: string[] = [];
    
    // Prioritize mobile money for African countries
    const mobileMoneyMethod = paymentMethods.find(m => m.payment_type === 'mobile_money');
    if (mobileMoneyMethod) {
      recommendations.push('mobile_money');
    }
    
    // Add payment gateway if available
    const gatewayMethod = paymentMethods.find(m => m.payment_type === 'payment_gateway');
    if (gatewayMethod) {
      recommendations.push('payment_gateway');
    }
    
    // Add bank transfer
    const bankMethod = paymentMethods.find(m => m.payment_type === 'bank_transfer');
    if (bankMethod) {
      recommendations.push('bank_transfer');
    }
    
    return recommendations.slice(0, 3);
  };

  const recommendedMethods = getRecommendedMethods();

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "cash": return <Wallet className="h-5 w-5" />;
      case "bank_transfer": return <Building2 className="h-5 w-5" />;
      case "mobile_money": return <Smartphone className="h-5 w-5" />;
      case "payment_gateway": return <CreditCard className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodLabel = (type: string) => {
    switch (type) {
      case "cash": return "Cash Payment";
      case "bank_transfer": return "Bank Transfer";
      case "mobile_money": return "Mobile Money";
      case "payment_gateway": return "Card / Online";
      default: return type;
    }
  };

  const getMethodBadge = (type: string) => {
    switch (type) {
      case "mobile_money": return { label: "Popular", variant: "default" as const };
      case "payment_gateway": return { label: "Instant", variant: "secondary" as const };
      case "bank_transfer": return { label: "Secure", variant: "outline" as const };
      default: return null;
    }
  };

  const getProcessingTime = (type: string) => {
    switch (type) {
      case "payment_gateway": return "Instant";
      case "mobile_money": return "1-5 mins";
      case "bank_transfer": return "24-48 hrs";
      case "cash": return "On boarding";
      default: return "";
    }
  };

  const handleSelectMethod = (methodType: string) => {
    setSelectedMethod(methodType);
    setPaymentProof(null);
    setTransactionRef("");
  };

  const handleConfirm = () => {
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

    // Validate required fields
    if (selectedMethod === "bank_transfer" && !paymentProof) {
      toast.error("Please upload payment proof");
      return;
    }

    if (selectedMethod === "mobile_money" && !transactionRef) {
      toast.error("Please enter transaction reference");
      return;
    }

    onConfirmPayment(selectedMethod, {
      paymentProof,
      transactionRef,
      configuration: method.configuration,
    });
  };

  const handleWhatsAppSupport = () => {
    const number = merchantWhatsApp || "263789583003";
    const message = encodeURIComponent(
      `Hi, I need help with my booking:\n${bookingData.itemName}\n${bookingData.from ? `Route: ${bookingData.from} → ${bookingData.to}` : ''}\nTotal: ${convertPrice(bookingData.totalPrice)}`
    );
    window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

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

  const renderPaymentDetails = () => {
    const method = paymentMethods.find(m => m.payment_type === selectedMethod);
    if (!method) return null;

    switch (selectedMethod) {
      case "cash":
        return (
          <Alert className="bg-orange-500/10 border-orange-500/30">
            <Wallet className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-sm">
              Reserve now, pay cash at boarding. Reservation expires 1 hour before departure.
            </AlertDescription>
          </Alert>
        );

      case "bank_transfer":
        const bankConfig = method.configuration as BankTransferConfig;
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">{bankConfig.bank_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account</span>
                <span className="font-mono font-medium">{bankConfig.account_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{bankConfig.account_name}</span>
              </div>
              {bankConfig.swift_code && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SWIFT</span>
                  <span className="font-mono font-medium">{bankConfig.swift_code}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-proof" className="text-sm font-medium">
                Upload Payment Proof *
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="payment-proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {paymentProof && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank-ref" className="text-sm font-medium">
                Transaction Reference
              </Label>
              <Input
                id="bank-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter bank reference number"
              />
            </div>
          </div>
        );

      case "mobile_money":
        const mobileConfig = method.configuration as MobileMoneyConfig;
        const displayName = providerNames[mobileConfig.provider] || mobileConfig.provider;
        
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
        
        const ussdCode = ussdCodes[mobileConfig.provider] || mobileConfig.shortcode;
        
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-semibold">{displayName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Business Number</span>
                <span className="font-mono font-medium">{mobileConfig.business_number}</span>
              </div>
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
              {mobileConfig.instructions && (
                <p className="text-sm text-muted-foreground">{mobileConfig.instructions}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-ref" className="text-sm font-medium">
                Transaction Reference *
              </Label>
              <Input
                id="mobile-ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter confirmation code from your phone"
              />
              <p className="text-xs text-muted-foreground">
                Enter the transaction ID you received after payment
              </p>
            </div>
          </div>
        );

      case "payment_gateway":
        return (
          <div className="space-y-3">
            <Alert className="bg-primary/5 border-primary/20">
              <CreditCard className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                You'll be securely redirected to TodaPay to complete your transaction.
              </AlertDescription>
            </Alert>
            <div className="text-center text-[10px] text-muted-foreground">
              Powered by <span className="font-semibold">TodaPay</span> · Toda Technologies
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No payment methods available for this operator.
          </p>
          <Button variant="outline" onClick={handleWhatsAppSupport}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Secure Checkout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{bookingData.itemName}</span>
            </div>
            {bookingData.from && bookingData.to && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Route</span>
                <span>{bookingData.from} → {bookingData.to}</span>
              </div>
            )}
            {bookingData.selectedSeats && bookingData.selectedSeats.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seats</span>
                <span>{bookingData.selectedSeats.join(", ")}</span>
              </div>
            )}
            {bookingData.ticketQuantity && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tickets</span>
                <span>×{bookingData.ticketQuantity}</span>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-primary">{convertPrice(bookingData.totalPrice)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Payment Methods */}
      {recommendedMethods.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {recommendedMethods.map((methodType) => {
                const method = paymentMethods.find(m => m.payment_type === methodType);
                if (!method) return null;
                const badge = getMethodBadge(methodType);
                
                return (
                  <button
                    key={methodType}
                    onClick={() => handleSelectMethod(methodType)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                      selectedMethod === methodType
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      selectedMethod === methodType ? "bg-primary/10" : "bg-muted"
                    )}>
                      {getMethodIcon(methodType)}
                    </div>
                    <span className="text-xs font-medium text-center">
                      {getMethodLabel(methodType).split(" ")[0]}
                    </span>
                    {badge && (
                      <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0">
                        {badge.label}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Payment Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Payment Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelectMethod(method.payment_type)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                selectedMethod === method.payment_type
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  selectedMethod === method.payment_type ? "bg-primary/10" : "bg-muted"
                )}>
                  {getMethodIcon(method.payment_type)}
                </div>
                <div className="text-left">
                  <span className="font-medium text-sm">
                    {getMethodLabel(method.payment_type)}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getProcessingTime(method.payment_type)}
                  </div>
                </div>
              </div>
              {selectedMethod === method.payment_type ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Payment Details */}
      {selectedMethod && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            {renderPaymentDetails()}
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Support */}
      <button
        onClick={handleWhatsAppSupport}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 hover:bg-green-500/20 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Need help? Chat with us</span>
      </button>

      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={
          loading || 
          !selectedMethod || 
          (selectedMethod === "bank_transfer" && !paymentProof) ||
          (selectedMethod === "mobile_money" && !transactionRef)
        }
        className="w-full h-12 text-base"
        size="lg"
      >
        {loading ? (
          "Processing..."
        ) : (
          <>
            Complete Payment • {convertPrice(bookingData.totalPrice)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Powered by <span className="font-semibold">TodaPay</span> · By completing this payment, you agree to our terms of service
      </p>
    </div>
  );
}