import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar, CreditCard } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PaymentPlanSelectorProps {
  totalPrice: number;
  selectedPlan: string;
  onPlanChange: (plan: string) => void;
}

const PaymentPlanSelector = ({
  totalPrice,
  selectedPlan,
  onPlanChange,
}: PaymentPlanSelectorProps) => {
  const { convertPrice } = useCurrency();

  const plans = [
    {
      id: "full",
      name: "Pay in Full",
      installments: 1,
      icon: CreditCard,
      description: "One-time payment",
    },
    {
      id: "2-installments",
      name: "Pay in 2 Installments",
      installments: 2,
      icon: Calendar,
      description: "Split into 2 payments",
      fee: 0.02, // 2% fee
    },
    {
      id: "3-installments",
      name: "Pay in 3 Installments",
      installments: 3,
      icon: Calendar,
      description: "Split into 3 payments",
      fee: 0.03, // 3% fee
    },
    {
      id: "4-installments",
      name: "Pay in 4 Installments",
      installments: 4,
      icon: Calendar,
      description: "Split into 4 payments",
      fee: 0.04, // 4% fee
    },
  ];

  const calculateInstallmentAmount = (plan: any) => {
    const feeAmount = plan.fee ? totalPrice * plan.fee : 0;
    const totalWithFee = totalPrice + feeAmount;
    return totalWithFee / plan.installments;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Payment Options
      </h3>
      <RadioGroup value={selectedPlan} onValueChange={onPlanChange}>
        <div className="space-y-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const installmentAmount = calculateInstallmentAmount(plan);
            return (
              <div
                key={plan.id}
                className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPlan === plan.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onPlanChange(plan.id)}
              >
                <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={plan.id} className="flex items-center gap-2 cursor-pointer">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{plan.name}</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-2">
                    {plan.installments === 1 ? (
                      <span className="font-semibold text-lg">{convertPrice(totalPrice)}</span>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-lg">
                            {convertPrice(installmentAmount)}
                          </span>
                          <span className="text-sm text-muted-foreground">per payment</span>
                        </div>
                        {plan.fee && (
                          <p className="text-xs text-muted-foreground">
                            Total: {convertPrice(totalPrice + totalPrice * plan.fee)} (incl. {plan.fee * 100}% fee)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </RadioGroup>
    </Card>
  );
};

export default PaymentPlanSelector;
