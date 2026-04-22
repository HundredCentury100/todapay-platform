import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Zap, CreditCard, Smartphone, Building2, Star, Trash2, 
  Plus, CheckCircle, Loader2
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { savedPaymentService, SavedPaymentMethod } from "@/services/savedPaymentService";
import { useToast } from "@/hooks/use-toast";

interface ExpressCheckoutProps {
  totalAmount: number;
  onPaymentComplete: (paymentData: any) => Promise<void>;
  onNoSavedMethods?: () => void;
}

export const ExpressCheckout = ({
  totalAmount,
  onPaymentComplete,
  onNoSavedMethods,
}: ExpressCheckoutProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saveNewMethod, setSaveNewMethod] = useState(false);

  useEffect(() => {
    loadSavedMethods();
  }, []);

  const loadSavedMethods = async () => {
    try {
      const methods = await savedPaymentService.getSavedMethods();
      setSavedMethods(methods);
      
      if (methods.length === 0) {
        onNoSavedMethods?.();
      } else {
        const defaultMethod = methods.find(m => m.is_default) || methods[0];
        setSelectedMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error("Failed to load saved methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpressPayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select a saved payment method",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const method = savedMethods.find(m => m.id === selectedMethod);
      if (!method) throw new Error("Method not found");

      await onPaymentComplete({
        methodType: method.payment_type,
        provider: method.provider,
        savedMethodId: method.id,
        isExpressPayment: true,
      });

      toast({
        title: "Payment Successful",
        description: "Your express payment has been processed",
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      await savedPaymentService.deleteMethod(methodId);
      setSavedMethods(prev => prev.filter(m => m.id !== methodId));
      
      if (selectedMethod === methodId) {
        const remaining = savedMethods.filter(m => m.id !== methodId);
        setSelectedMethod(remaining[0]?.id || null);
      }

      toast({
        title: "Method Removed",
        description: "Payment method has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await savedPaymentService.setDefaultMethod(methodId);
      setSavedMethods(prev => 
        prev.map(m => ({ ...m, is_default: m.id === methodId }))
      );
      toast({
        title: "Default Updated",
        description: "Default payment method has been changed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default method",
        variant: "destructive",
      });
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'mobile_money':
        return <Smartphone className="h-5 w-5" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />;
      case 'payment_gateway':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (savedMethods.length === 0) {
    return (
      <Alert>
        <Plus className="h-4 w-4" />
        <AlertDescription>
          No saved payment methods found. Complete a payment with "Save for future" 
          checked to enable Express Checkout.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold">One-Click Payment</span>
        <Badge variant="secondary" className="ml-auto">Express</Badge>
      </div>

      <RadioGroup value={selectedMethod || ''} onValueChange={setSelectedMethod}>
        {savedMethods.map((method) => (
          <Card 
            key={method.id} 
            className={`cursor-pointer transition-colors ${
              selectedMethod === method.id ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer">
                    <div className="p-2 bg-muted rounded-lg">
                      {getMethodIcon(method.payment_type)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {method.display_name || method.payment_type}
                        {method.is_default && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.masked_reference && (
                        <div className="text-sm text-muted-foreground">
                          {savedPaymentService.getMaskedDisplay(
                            method.payment_type, 
                            method.masked_reference
                          )}
                        </div>
                      )}
                      {method.provider && (
                        <div className="text-xs text-muted-foreground capitalize">
                          {method.provider.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  {!method.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(method.id);
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMethod(method.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>

      <Button
        onClick={handleExpressPayment}
        disabled={!selectedMethod || processing}
        className="w-full h-12 text-lg"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-5 w-5" />
            Pay {convertPrice(totalAmount)} Now
          </>
        )}
      </Button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
        <CheckCircle className="h-4 w-4" />
        <span>Secure one-click payment with saved credentials</span>
      </div>
    </div>
  );
};
