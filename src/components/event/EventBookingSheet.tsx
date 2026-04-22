import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Ticket, ChevronUp, ChevronDown, User, Mail, Phone } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { EventTicketTier } from "@/services/eventService";

interface EventBookingSheetProps {
  event: any;
  selectedTier: EventTicketTier | null;
  onTierSelect: (tier: EventTicketTier) => void;
  selectedSeatCount: number;
  totalPrice: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
  isCashReservation: boolean;
  onCashReservationChange: (value: boolean) => void;
  onBook: () => void;
  disabled: boolean;
  children?: React.ReactNode;
}

const EventBookingSheet = ({
  event,
  selectedTier,
  onTierSelect,
  selectedSeatCount,
  totalPrice,
  passengerName,
  passengerEmail,
  passengerPhone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  isCashReservation,
  onCashReservationChange,
  onBook,
  disabled,
  children,
}: EventBookingSheetProps) => {
  const { convertPrice } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(false);

  const lowestPrice = event.event_ticket_tiers?.reduce(
    (min: number, tier: EventTicketTier) => Math.min(min, tier.price),
    Infinity
  ) || 0;

  return (
    <>
      {/* Sticky CTA Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-pb">
        <Drawer open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="bg-background border-t border-border px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-lg font-bold">{convertPrice(lowestPrice)}</p>
              </div>
              <DrawerTrigger asChild>
                <Button size="lg" className="gap-2 px-6">
                  <Ticket className="h-4 w-4" />
                  Get Tickets
                  <ChevronUp className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </DrawerTrigger>
            </div>
          </div>

          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b pb-4">
              <DrawerTitle>Select Tickets</DrawerTitle>
            </DrawerHeader>

            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-4 space-y-6">
                {/* Ticket Tiers - Horizontal Scroll */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Choose Ticket Type</h3>
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-3 pb-2">
                      {event.event_ticket_tiers?.map((tier: EventTicketTier) => (
                        <Card
                          key={tier.id}
                          className={`flex-shrink-0 w-44 p-3 cursor-pointer transition-all ${
                            selectedTier?.id === tier.id
                              ? "border-primary border-2 bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => onTierSelect(tier)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-sm truncate">{tier.name}</h4>
                            {tier.available_tickets === 0 && (
                              <Badge variant="secondary" className="text-xs">Sold Out</Badge>
                            )}
                          </div>
                          <p className="text-lg font-bold text-primary mb-1">
                            {convertPrice(tier.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tier.available_tickets} left
                          </p>
                        </Card>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* Seat Selection Content */}
                {children}

                {/* Your Details */}
                {selectedSeatCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-medium">Your Details</h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Full Name"
                          value={passengerName}
                          onChange={(e) => onNameChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={passengerEmail}
                          onChange={(e) => onEmailChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Phone"
                          value={passengerPhone}
                          onChange={(e) => onPhoneChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Cash Reservation */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div>
                        <Label htmlFor="cash-mobile" className="text-sm font-medium">
                          Reserve for Cash Payment
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Pay at our office before the event
                        </p>
                      </div>
                      <Switch
                        id="cash-mobile"
                        checked={isCashReservation}
                        onCheckedChange={onCashReservationChange}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Summary & Book Button */}
                {selectedSeatCount > 0 && (
                  <div className="sticky bottom-0 bg-background pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedSeatCount} ticket{selectedSeatCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xl font-bold">{convertPrice(totalPrice)}</p>
                      </div>
                      <Button
                        size="lg"
                        onClick={onBook}
                        disabled={disabled}
                        className="px-8"
                      >
                        Proceed to Pay
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop Sticky Sidebar Summary */}
      <div className="hidden md:block sticky top-24">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Booking Summary</h3>
          {selectedTier ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket Type</span>
                <span>{selectedTier.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{selectedSeatCount}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{convertPrice(totalPrice)}</span>
              </div>
              <Button
                className="w-full mt-3"
                size="lg"
                onClick={onBook}
                disabled={disabled}
              >
                Proceed to Payment
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a ticket tier to continue
            </p>
          )}
        </Card>
      </div>
    </>
  );
};

export default EventBookingSheet;
