import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, DollarSign, ArrowRightLeft, Wallet } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

export type AgentPaymentMethod = 'agent_retains' | 'client_pays_merchant' | 'agent_pays_upfront';

interface AgentPaymentOptionsProps {
  totalAmount: number;
  commissionRate: number;
  onMethodChange: (method: AgentPaymentMethod, remittanceAmount: number, commissionAmount: number) => void;
  merchantAllowsCommissionDeduction?: boolean;
}

export const AgentPaymentOptions = ({
  totalAmount,
  commissionRate,
  onMethodChange,
  merchantAllowsCommissionDeduction = true,
}: AgentPaymentOptionsProps) => {
  const [selectedMethod, setSelectedMethod] = useState<AgentPaymentMethod>('agent_retains');
  const { convertPrice } = useCurrency();

  const commissionAmount = totalAmount * (commissionRate / 100);
  const remittanceAmount = totalAmount - commissionAmount;

  const handleMethodChange = (value: AgentPaymentMethod) => {
    setSelectedMethod(value);
    
    let finalRemittance = totalAmount;
    let finalCommission = commissionAmount;
    
    if (value === 'agent_retains' && merchantAllowsCommissionDeduction) {
      finalRemittance = remittanceAmount;
    }
    
    onMethodChange(value, finalRemittance, finalCommission);
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Agent Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you'll handle payment for this booking
        </p>
      </div>

      <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
        {/* Option 1: Agent Retains Commission */}
        {merchantAllowsCommissionDeduction && (
          <Card className={`p-4 cursor-pointer transition-colors ${
            selectedMethod === 'agent_retains' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
          }`}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="agent_retains" id="agent_retains" className="mt-1" />
              <Label htmlFor="agent_retains" className="flex-1 cursor-pointer space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="font-semibold">Agent Collects & Remits</span>
                  <span className="text-xs text-primary font-medium">Most Popular</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You collect payment from client, retain your commission, and remit the balance to merchant
                </p>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total Ticket Price:</span>
                    <span className="font-medium">{convertPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary">
                    <span>Your Commission ({commissionRate}%):</span>
                    <span className="font-medium">- {convertPrice(commissionAmount)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>You Remit to Merchant:</span>
                    <span>{convertPrice(remittanceAmount)}</span>
                  </div>
                </div>
              </Label>
            </div>
          </Card>
        )}

        {/* Option 2: Client Pays Merchant Directly */}
        <Card className={`p-4 cursor-pointer transition-colors ${
          selectedMethod === 'client_pays_merchant' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
        }`}>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="client_pays_merchant" id="client_pays_merchant" className="mt-1" />
            <Label htmlFor="client_pays_merchant" className="flex-1 cursor-pointer space-y-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span className="font-semibold">Client Pays Merchant</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Client pays merchant directly. Platform tracks and pays your commission later
              </p>
              <div className="bg-muted p-3 rounded-md space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Client Pays Merchant:</span>
                  <span className="font-medium">{convertPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-primary">
                  <span>Your Commission ({commissionRate}%):</span>
                  <span className="font-medium">{convertPrice(commissionAmount)}</span>
                </div>
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Commission paid during next payout cycle
                  </AlertDescription>
                </Alert>
              </div>
            </Label>
          </div>
        </Card>

        {/* Option 3: Agent Pays Upfront */}
        <Card className={`p-4 cursor-pointer transition-colors ${
          selectedMethod === 'agent_pays_upfront' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
        }`}>
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="agent_pays_upfront" id="agent_pays_upfront" className="mt-1" />
            <Label htmlFor="agent_pays_upfront" className="flex-1 cursor-pointer space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">Agent Pays Upfront</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You pay merchant full amount now, collect from client later (at your markup)
              </p>
              <div className="bg-muted p-3 rounded-md space-y-1">
                <div className="flex justify-between text-sm">
                  <span>You Pay Merchant:</span>
                  <span className="font-medium">{convertPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Minimum to Collect:</span>
                  <span className="font-medium">{convertPrice(totalAmount + commissionAmount)}</span>
                </div>
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    You can charge client any amount above ticket price
                  </AlertDescription>
                </Alert>
              </div>
            </Label>
          </div>
        </Card>
      </RadioGroup>

      {!merchantAllowsCommissionDeduction && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This merchant requires agents to remit the full ticket amount. Commission deduction is not available.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};
