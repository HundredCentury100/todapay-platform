import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Users, Briefcase, Car, Calendar, Clock, CreditCard, Banknote, Wallet, Star, User, Phone, Mail,
} from "lucide-react";
import { TransferFormData } from "./TransferBookingForm";
import { TransferProvider } from "./TransferProviderResults";
import { PassengerData } from "@/pages/TransferBooking";
import { VEHICLE_CATEGORIES, SERVICE_TYPES } from "@/types/transfer";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface TransferBookingSummaryProps {
  formData: TransferFormData;
  provider: TransferProvider;
  passengerData: PassengerData;
  onConfirm: (paymentMethod: string) => void;
  isLoading?: boolean;
}

const SERVICE_MULTIPLIERS: Record<string, number> = {
  airport_pickup: 1.25,
  airport_dropoff: 1.2,
  point_to_point: 1.0,
  hourly_hire: 0.85,
  shuttle: 0.65,
  tour_transfer: 1.4,
  on_demand_taxi: 1.15,
};

export const TransferBookingSummary = ({
  formData,
  provider,
  passengerData,
  onConfirm,
  isLoading,
}: TransferBookingSummaryProps) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { convertPrice } = useCurrency();

  const vehicle = VEHICLE_CATEGORIES.find((c) => c.id === formData.vehicleCategory);
  const service = SERVICE_TYPES.find((s) => s.id === formData.serviceType);
  const svcMultiplier = SERVICE_MULTIPLIERS[formData.serviceType] || 1;

  const estimatedKm = 15;
  const baseFareCalc = provider.base_fare;
  const distanceCharge = provider.price_per_km * estimatedKm;
  const serviceCharge = Math.round(distanceCharge * (svcMultiplier - 1) * 100) / 100;
  const subtotal = provider.fixed_route_price || provider.estimated_price;
  const serviceFee = Math.max(1, Math.floor(subtotal / 50));
  const total = subtotal + serviceFee;

  const paymentOptions = [
    { value: "cash", label: "Cash", icon: Banknote, desc: "Pay driver directly" },
    { value: "wallet", label: "Wallet", icon: Wallet, desc: "Use wallet balance" },
    { value: "card", label: "Card", icon: CreditCard, desc: "Pay online" },
  ];

  return (
    <div className="space-y-4">
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

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs">{vehicle?.icon} {vehicle?.name}</Badge>
            <Badge variant="outline" className="gap-1 text-xs">{service?.icon} {service?.name}</Badge>
            <Badge variant="outline" className="gap-1 text-xs"><Users className="h-3 w-3" /> {formData.passengers}</Badge>
            {formData.luggage > 0 && (
              <Badge variant="outline" className="gap-1 text-xs"><Briefcase className="h-3 w-3" /> {formData.luggage}</Badge>
            )}
          </div>

          {formData.bookingType === "scheduled" && formData.scheduledDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formData.scheduledDate}</span>
              {formData.scheduledTime && (<><Clock className="h-4 w-4 ml-2" /><span>{formData.scheduledTime}</span></>)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {provider.profile_photo ? (
                <img src={provider.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <Car className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{provider.name}</p>
              <p className="text-xs text-muted-foreground">{provider.vehicle_info}</p>
            </div>
            {provider.rating && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {provider.rating.toFixed(1)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Passenger */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">Passenger Details</h3>
          <div className="grid grid-cols-1 gap-1 text-sm">
            <p className="flex items-center gap-2"><User className="h-3 w-3 text-muted-foreground" /> {passengerData.name}</p>
            <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /> {passengerData.email}</p>
            <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /> {passengerData.phone}</p>
            {passengerData.specialRequirements && (
              <p className="text-xs text-muted-foreground mt-1">{passengerData.specialRequirements}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fare Breakdown */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Fare Breakdown</h3>
          <div className="space-y-2 text-sm">
            {provider.fixed_route_price ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fixed route price</span>
                <span>{convertPrice(provider.fixed_route_price)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base fare</span>
                  <span>{convertPrice(baseFareCalc)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance (~{estimatedKm} km × ${provider.price_per_km.toFixed(2)})</span>
                  <span>{convertPrice(distanceCharge)}</span>
                </div>
                {serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{service?.name} surcharge</span>
                    <span>{convertPrice(serviceCharge)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service fee</span>
              <span>{convertPrice(serviceFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold bg-primary/5 -mx-4 px-4 py-2 rounded-lg">
              <span>Total</span>
              <span className="text-primary">{convertPrice(total)}</span>
            </div>
          </div>
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
                  htmlFor={`pay-${opt.value}`}
                  className={cn(
                    "flex items-center gap-3 p-3 min-h-[56px] rounded-xl border cursor-pointer transition-colors",
                    paymentMethod === opt.value ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <RadioGroupItem value={opt.value} id={`pay-${opt.value}`} />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Confirm */}
      <Button
        className="w-full h-14 text-lg font-semibold"
        onClick={() => onConfirm(paymentMethod)}
        disabled={isLoading}
      >
        {isLoading ? "Confirming..." : `Confirm & Pay ${convertPrice(total)}`}
      </Button>
    </div>
  );
};
