import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Shield, Calendar, CreditCard, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlexiBookingOptionsProps {
  onOptionsChange: (options: { 
    flexiTicket: boolean; 
    cancellationInsurance: boolean; 
    payLater: boolean;
  }, totalAddOnPrice: number, groupDiscount: number) => void;
  numberOfSeats: number;
}

const FlexiBookingOptions = ({ onOptionsChange, numberOfSeats }: FlexiBookingOptionsProps) => {
  const { convertPrice } = useCurrency();
  const [flexiTicket, setFlexiTicket] = useState(false);
  const [cancellationInsurance, setCancellationInsurance] = useState(false);
  const [payLater, setPayLater] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const flexiPrice = 15;
  const insurancePrice = 10;
  const groupDiscount = numberOfSeats >= 5 ? 0.1 : 0;

  const totalAddOnPrice = (flexiTicket ? flexiPrice : 0) + (cancellationInsurance ? insurancePrice : 0);

  const handleChange = (option: 'flexi' | 'insurance' | 'payLater', value: boolean) => {
    const newOptions = {
      flexiTicket: option === 'flexi' ? value : flexiTicket,
      cancellationInsurance: option === 'insurance' ? value : cancellationInsurance,
      payLater: option === 'payLater' ? value : payLater,
    };
    
    if (option === 'flexi') setFlexiTicket(value);
    if (option === 'insurance') setCancellationInsurance(value);
    if (option === 'payLater') setPayLater(value);

    const addOnPrice = (newOptions.flexiTicket ? flexiPrice : 0) + (newOptions.cancellationInsurance ? insurancePrice : 0);
    onOptionsChange(newOptions, addOnPrice, groupDiscount);
  };

  const selectedCount = [flexiTicket, cancellationInsurance, payLater].filter(Boolean).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-semibold">Flexible Booking Options</h3>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
              {selectedCount > 0 && !isOpen && (
                <Badge variant="default" className="text-xs">{selectedCount} selected</Badge>
              )}
            </div>
            <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <Checkbox
                id="flexi"
                checked={flexiTicket}
                onCheckedChange={(checked) => handleChange('flexi', !!checked)}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="flexi" className="cursor-pointer flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Flexi-Ticket</span>
                  </Label>
                  <span className="font-semibold text-sm">{convertPrice(flexiPrice)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Change date/time once for a small fee. Perfect for uncertain schedules.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <Checkbox
                id="insurance"
                checked={cancellationInsurance}
                onCheckedChange={(checked) => handleChange('insurance', !!checked)}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="insurance" className="cursor-pointer flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Cancellation Insurance</span>
                  </Label>
                  <span className="font-semibold text-sm">{convertPrice(insurancePrice)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Get full refund if you need to cancel. Terms & conditions apply.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <Checkbox
                id="payLater"
                checked={payLater}
                onCheckedChange={(checked) => handleChange('payLater', !!checked)}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="payLater" className="cursor-pointer flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">Book Now, Pay Later</span>
                  </Label>
                  <Badge variant="secondary" className="text-xs">No extra fee</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Reserve your seat and pay up to 7 days before travel.
                </p>
              </div>
            </div>

            {groupDiscount > 0 && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="w-4 h-4" />
                  <span className="font-medium text-sm">Group Discount Applied!</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Save {(groupDiscount * 100).toFixed(0)}% when booking {numberOfSeats}+ seats
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default FlexiBookingOptions;
