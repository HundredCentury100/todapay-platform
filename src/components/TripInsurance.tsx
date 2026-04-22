import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, Check, AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface InsuranceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  priceType: 'percentage' | 'flat';
  coverage: string[];
  maxCoverage: number;
}

const insuranceOptions: InsuranceOption[] = [
  {
    id: "none",
    name: "No Insurance",
    description: "Travel without insurance coverage",
    price: 0,
    priceType: 'flat',
    coverage: [],
    maxCoverage: 0,
  },
  {
    id: "basic",
    name: "Basic Protection",
    description: "Essential coverage for peace of mind",
    price: 5,
    priceType: 'percentage',
    coverage: [
      "Trip cancellation up to $500",
      "Trip delay (6+ hours)",
      "Missed connection",
      "Emergency contact assistance",
    ],
    maxCoverage: 500,
  },
  {
    id: "standard",
    name: "Standard Coverage",
    description: "Comprehensive protection for most travelers",
    price: 8,
    priceType: 'percentage',
    coverage: [
      "Trip cancellation up to $2,000",
      "Trip delay (3+ hours)",
      "Medical emergency up to $10,000",
      "Lost or delayed baggage up to $1,000",
      "Emergency evacuation",
      "24/7 travel assistance",
    ],
    maxCoverage: 2000,
  },
  {
    id: "premium",
    name: "Premium Protection",
    description: "Maximum coverage and benefits",
    price: 12,
    priceType: 'percentage',
    coverage: [
      "Trip cancellation up to $5,000",
      "Trip delay (2+ hours)",
      "Medical emergency up to $50,000",
      "Lost or delayed baggage up to $3,000",
      "Emergency evacuation & repatriation",
      "Adventure & sports activities coverage",
      "Cancel for any reason (75% refund)",
      "24/7 concierge service",
      "Pre-existing conditions coverage",
    ],
    maxCoverage: 5000,
  },
];

interface TripInsuranceProps {
  basePrice: number;
  onInsuranceChange: (option: InsuranceOption | null, price: number) => void;
}

const TripInsurance = ({ basePrice, onInsuranceChange }: TripInsuranceProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("none");
  const [isOpen, setIsOpen] = useState(false);

  const calculateInsurancePrice = (option: InsuranceOption): number => {
    if (option.priceType === 'percentage') {
      return (basePrice * option.price) / 100;
    }
    return option.price;
  };

  const handleOptionChange = (optionId: string) => {
    setSelectedOption(optionId);
    const option = insuranceOptions.find(opt => opt.id === optionId);
    if (option) {
      const price = calculateInsurancePrice(option);
      onInsuranceChange(option.id === "none" ? null : option, price);
    }
  };

  const selectedPlan = insuranceOptions.find(opt => opt.id === selectedOption);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Trip Insurance</h2>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
              {selectedOption !== "none" && !isOpen && (
                <Badge variant="default" className="text-xs">{selectedPlan?.name}</Badge>
              )}
            </div>
            <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Protect your trip against unexpected events. Insurance pricing is based on your total ticket cost.
              </AlertDescription>
            </Alert>

            <RadioGroup value={selectedOption} onValueChange={handleOptionChange} className="space-y-3 sm:space-y-4">
              {insuranceOptions.map((option) => {
                const price = calculateInsurancePrice(option);
                const isSelected = selectedOption === option.id;

                return (
                  <div key={option.id} className="relative">
                    <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                    <Label
                      htmlFor={option.id}
                      className={cn(
                        "flex cursor-pointer rounded-lg border-2 p-3 sm:p-4 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-border"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-semibold">{option.name}</h3>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <span className="text-sm sm:text-base font-bold">
                            {option.id === "none" ? (
                              "Free"
                            ) : (
                              <>+${price.toFixed(2)}</>
                            )}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{option.description}</p>
                        {option.coverage.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {option.coverage.map((item, index) => (
                              <li key={index} className="text-xs sm:text-sm flex items-start gap-2">
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default TripInsurance;
