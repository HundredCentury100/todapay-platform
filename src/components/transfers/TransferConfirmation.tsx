import { motion } from "framer-motion";
import { MapPin, Users, Briefcase, Car, Calendar, Clock, CreditCard, Banknote, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { TransferFormData } from "./TransferBookingForm";
import { VEHICLE_CATEGORIES, SERVICE_TYPES } from "@/types/transfer";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface TransferConfirmationProps {
  formData: TransferFormData;
  estimatedPrice: number;
  onConfirm: (paymentMethod: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const TransferConfirmation = ({
  formData,
  estimatedPrice,
  onConfirm,
  onBack,
  isLoading,
}: TransferConfirmationProps) => {
  const [paymentMethod, setPaymentMethod] = useState("toda_pay");
  const { convertPrice } = useCurrency();

  const vehicle = VEHICLE_CATEGORIES.find((c) => c.id === formData.vehicleCategory);
  const service = SERVICE_TYPES.find((s) => s.id === formData.serviceType);

  const paymentOptions = [
    { value: "toda_pay", label: "TodaPay", icon: Shield, desc: "Card, Mobile Money, Bank", badge: "Recommended" },
    { value: "cash", label: "Cash", icon: Banknote, desc: "Pay driver directly", badge: null },
    { value: "wallet", label: "Wallet", icon: Wallet, desc: "Use wallet balance", badge: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Route Summary */}
      <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">Trip Summary</h3>

          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div className="w-0.5 h-10 bg-gradient-to-b from-green-500 to-primary" />
              <div className="h-3 w-3 rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium text-sm">{formData.pickupLocation}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="font-medium text-sm">{formData.dropoffLocation}</p>
              </div>
            </div>
          </div>

          {/* Details row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              {vehicle?.icon} {vehicle?.name}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              {service?.icon} {service?.name}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="h-3 w-3" /> {formData.passengers}
            </Badge>
            {formData.luggage > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Briefcase className="h-3 w-3" /> {formData.luggage}
              </Badge>
            )}
          </div>

          {formData.bookingType === "scheduled" && formData.scheduledDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formData.scheduledDate}</span>
              {formData.scheduledTime && (
                <>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{formData.scheduledTime}</span>
                </>
              )}
            </div>
          )}

          {formData.flightNumber && (
            <p className="text-sm text-muted-foreground">✈️ Flight: {formData.flightNumber}</p>
          )}
        </CardContent>
      </Card>

      {/* Estimated Fare */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Estimated Fare</p>
            <p className="text-3xl font-bold">{convertPrice(estimatedPrice)}</p>
          </div>
          <Car className="h-10 w-10 text-primary/30" />
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Payment Method</h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
            {paymentOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <Label
                  key={opt.value}
                  htmlFor={opt.value}
                  className={cn(
                    "flex items-center gap-3 p-3 min-h-[56px] rounded-xl border cursor-pointer transition-colors",
                    paymentMethod === opt.value ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {opt.badge && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                        {opt.badge}
                      </Badge>
                    )}
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-14" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button
          className="flex-1 h-14 text-lg font-semibold"
          onClick={() => onConfirm(paymentMethod)}
          disabled={isLoading}
        >
          {isLoading ? "Confirming..." : "Confirm Booking"}
        </Button>
      </div>
    </motion.div>
  );
};
