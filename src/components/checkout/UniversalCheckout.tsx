import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bus, Calendar, MapPin, Users, Bed, Building2, Ticket, 
  Clock, CreditCard, Wallet, Shield, Zap, CheckCircle, Tag
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MerchantPaymentMethod } from "@/types/payment";
import { ExpressCheckout } from "./ExpressCheckout";
import { SmartCheckout } from "./SmartCheckout";
import { SplitPaymentManager } from "./SplitPaymentManager";
import { PaymentCountdown } from "./PaymentCountdown";
import { PromoCodeInput } from "@/components/promo/PromoCodeInput";
import { format } from "date-fns";

type BookingType = 'bus' | 'event' | 'stay' | 'workspace' | 'venue' | 'experience';

interface AppliedPromo {
  code: string;
  discount: number;
  description?: string;
  promo_code_id?: string;
}

interface UniversalCheckoutProps {
  bookingData: {
    type: BookingType;
    itemName: string;
    totalPrice: number;
    // Bus specific
    from?: string;
    to?: string;
    date?: string;
    departureTime?: string;
    arrivalTime?: string;
    selectedSeats?: string[];
    operator?: string;
    // Event specific
    eventDate?: string;
    eventTime?: string;
    venue?: string;
    ticketQuantity?: number;
    // Stay specific
    checkInDate?: string;
    checkOutDate?: string;
    roomName?: string;
    numGuests?: number;
    numRooms?: number;
    propertyCity?: string;
    // Workspace specific
    startDatetime?: string;
    endDatetime?: string;
    workspaceType?: string;
    numAttendees?: number;
    // Common
    passengerName: string;
    passengerEmail: string;
    passengerPhone: string;
    reservationType?: string;
    reservationExpiresAt?: string;
  };
  paymentMethods: MerchantPaymentMethod[];
  merchantProfileId: string | null;
  onPaymentComplete: (paymentData: any) => Promise<void>;
  isLoading?: boolean;
  allowSplitPayment?: boolean;
  showPromoCode?: boolean;
}

export const UniversalCheckout = ({
  bookingData,
  paymentMethods,
  merchantProfileId,
  onPaymentComplete,
  isLoading = false,
  allowSplitPayment = false,
  showPromoCode = true,
}: UniversalCheckoutProps) => {
  const { convertPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'express' | 'standard' | 'split'>('standard');
  const [hasExpressOption, setHasExpressOption] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const discount = appliedPromo?.discount || 0;
  const finalPrice = Math.max(0, bookingData.totalPrice - discount);

  const getBookingTypeIcon = () => {
    switch (bookingData.type) {
      case 'bus': return <Bus className="h-5 w-5" />;
      case 'event': return <Ticket className="h-5 w-5" />;
      case 'stay': return <Bed className="h-5 w-5" />;
      case 'workspace': return <Building2 className="h-5 w-5" />;
      case 'venue': return <Building2 className="h-5 w-5" />;
      case 'experience': return <Users className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  const getBookingTypeLabel = () => {
    switch (bookingData.type) {
      case 'bus': return 'Bus Ticket';
      case 'event': return 'Event Ticket';
      case 'stay': return 'Accommodation';
      case 'workspace': return 'Workspace Booking';
      case 'venue': return 'Venue Booking';
      case 'experience': return 'Experience';
      default: return 'Booking';
    }
  };

  const renderBookingSummary = () => {
    switch (bookingData.type) {
      case 'bus':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{bookingData.from} → {bookingData.to}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{bookingData.date}</span>
              {bookingData.departureTime && (
                <span className="text-muted-foreground">at {bookingData.departureTime}</span>
              )}
            </div>
            {bookingData.selectedSeats && bookingData.selectedSeats.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Seats: {bookingData.selectedSeats.join(', ')}</span>
              </div>
            )}
          </div>
        );

      case 'event':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{bookingData.eventDate || bookingData.date}</span>
              {bookingData.eventTime && (
                <span className="text-muted-foreground">at {bookingData.eventTime}</span>
              )}
            </div>
            {bookingData.venue && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{bookingData.venue}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span>{bookingData.ticketQuantity || 1} ticket(s)</span>
            </div>
          </div>
        );

      case 'stay':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {bookingData.checkInDate} → {bookingData.checkOutDate}
              </span>
            </div>
            {bookingData.roomName && (
              <div className="flex items-center gap-2 text-sm">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span>{bookingData.roomName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {bookingData.numGuests || 1} guest(s), {bookingData.numRooms || 1} room(s)
              </span>
            </div>
          </div>
        );

      case 'workspace':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {bookingData.startDatetime && format(new Date(bookingData.startDatetime), 'PPP p')}
              </span>
            </div>
            {bookingData.workspaceType && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{bookingData.workspaceType.replace('_', ' ')}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{bookingData.numAttendees || 1} attendee(s)</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Reservation Countdown */}
      {bookingData.reservationExpiresAt && (
        <PaymentCountdown 
          expiresAt={bookingData.reservationExpiresAt}
          onExpired={() => {
            // Handle expiration
          }}
        />
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {getBookingTypeIcon()}
              {getBookingTypeLabel()}
            </CardTitle>
            <Badge variant="outline" className="text-primary">
              {convertPrice(bookingData.totalPrice)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold mb-3">{bookingData.itemName}</h4>
          {renderBookingSummary()}
          
          <Separator className="my-4" />

          {/* Promo Code Section */}
          {showPromoCode && (
            <div className="mb-4">
              <PromoCodeInput
                orderAmount={bookingData.totalPrice}
                vertical={bookingData.type}
                onPromoApplied={(promo) => {
                  setAppliedPromo({
                    code: promo.code,
                    discount: promo.discount,
                    description: promo.description,
                  });
                }}
                onPromoRemoved={() => setAppliedPromo(null)}
                appliedPromo={appliedPromo ? {
                  code: appliedPromo.code,
                  discount: appliedPromo.discount,
                  description: appliedPromo.description,
                } : undefined}
              />
            </div>
          )}
          
          {/* Price breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{convertPrice(bookingData.totalPrice)}</span>
            </div>
            {appliedPromo && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Promo: {appliedPromo.code}
                </span>
                <span>-{convertPrice(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary">{convertPrice(finalPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-4">
              <TabsTrigger value="standard" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Standard</span>
              </TabsTrigger>
              {hasExpressOption && (
                <TabsTrigger value="express" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Express</span>
                </TabsTrigger>
              )}
              {allowSplitPayment && bookingData.totalPrice > 500 && (
                <TabsTrigger value="split" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Split</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="standard">
              <SmartCheckout
                paymentMethods={paymentMethods}
                bookingData={{
                  ...bookingData,
                  type: bookingData.type as 'bus' | 'event',
                }}
                onConfirmPayment={onPaymentComplete}
                loading={isLoading}
              />
            </TabsContent>

            {hasExpressOption && (
              <TabsContent value="express">
                <ExpressCheckout
                  totalAmount={bookingData.totalPrice}
                  onPaymentComplete={onPaymentComplete}
                  onNoSavedMethods={() => {
                    setHasExpressOption(false);
                    setActiveTab('standard');
                  }}
                />
              </TabsContent>
            )}

            {allowSplitPayment && bookingData.totalPrice > 500 && (
              <TabsContent value="split">
                <SplitPaymentManager
                  bookingId={null}
                  totalAmount={bookingData.totalPrice}
                  onComplete={() => {
                    // Handle split payment completion
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Badges */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Instant Confirmation</span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="h-4 w-4" />
            <span>Multiple Options</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          Powered by <span className="font-semibold text-muted-foreground/80">Suvat Pay</span> · Toda Technologies
        </p>
      </div>
    </div>
  );
};
