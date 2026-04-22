import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Banknote, CreditCard, Wallet, Zap, Check, UserPlus, Loader2, Plus, X,
  Shield, Users, Clock, TrendingDown, Star, Sparkles, Heart, ChevronDown
} from "lucide-react";
import { FareBreakdownCard } from "@/components/rides/FareBreakdownCard";
import { PromoCodeInput } from "@/components/rides/PromoCodeInput";
import { cn } from "@/lib/utils";
import type { FareEstimate, PricingMode, VehicleType } from "@/types/ride";
import type { PromoValidationResult } from "@/services/promoCodeService";

// Vehicle icons — distinct SVG silhouettes per class
const VehicleIcon = ({ type, isSelected }: { type: string; isSelected: boolean }) => {
  const color = isSelected ? "text-primary" : "text-muted-foreground";
  switch (type) {
    case 'economy':
      return <svg viewBox="0 0 48 24" className={cn("w-10 h-5", color)} fill="currentColor"><path d="M8 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 12h4l3-6h18l5 6h10v4H4v-4z" /></svg>;
    case 'sedan':
      return <svg viewBox="0 0 48 24" className={cn("w-10 h-5", color)} fill="currentColor"><path d="M8 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 13h5l4-7h20l6 7h7v3H3v-3z" /></svg>;
    case 'suv':
      return <svg viewBox="0 0 48 28" className={cn("w-10 h-6", color)} fill="currentColor"><path d="M9 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm30 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 14h6l3-8h24l4 8h5v5H3v-5z" /></svg>;
    case 'van':
      return <svg viewBox="0 0 48 28" className={cn("w-10 h-6", color)} fill="currentColor"><path d="M9 23a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm30 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 5h28v14H3V5zm28 0h10l4 8v6H31V5z" /></svg>;
    case 'luxury':
      return <svg viewBox="0 0 48 24" className={cn("w-10 h-5", color)} fill="currentColor"><path d="M8 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 13h6l5-8h22l5 8h6v3H2v-3z" /><circle cx="24" cy="9" r="1.5" fill="currentColor" opacity="0.5" /></svg>;
    default:
      return <svg viewBox="0 0 48 24" className={cn("w-10 h-5", color)} fill="currentColor"><path d="M8 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm32 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 12h4l3-6h18l5 6h10v4H4v-4z" /></svg>;
  }
};

export interface VehicleOption {
  id: VehicleType;
  name: string;
  desc: string;
  seats: number;
  multiplier: number;
  eta: number;
}

interface MultiStop {
  address: string;
  coords: { lat: number; lng: number };
}

interface VehicleSelectStepProps {
  pickupAddress: string;
  dropoffAddress: string;
  selectedVehicle: VehicleType | 'any';
  fareEstimate: FareEstimate | null;
  surgeData: { multiplier: number; reason: string | null } | null;
  pricingMode: PricingMode;
  offerPrice: number;
  paymentMethod: 'cash' | 'card' | 'wallet';
  isBooking: boolean;
  bookingForOther: boolean;
  recipientName: string;
  recipientPhone: string;
  vehicles: VehicleOption[];
  formatPrice: (amount: number) => string;
  onVehicleSelect: (id: VehicleType) => void;
  onPricingModeChange: (mode: PricingMode) => void;
  onOfferPriceChange: (price: number) => void;
  onPaymentMethodChange: (method: 'cash' | 'card' | 'wallet') => void;
  onBookingForOtherChange: (value: boolean) => void;
  onRecipientNameChange: (name: string) => void;
  onRecipientPhoneChange: (phone: string) => void;
  onBook: () => void;
  stops: MultiStop[];
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
}

export const VehicleSelectStep = ({
  pickupAddress, dropoffAddress,
  selectedVehicle, fareEstimate, surgeData,
  pricingMode, offerPrice, paymentMethod,
  isBooking, bookingForOther, recipientName, recipientPhone,
  vehicles, formatPrice,
  onVehicleSelect, onPricingModeChange, onOfferPriceChange,
  onPaymentMethodChange, onBookingForOtherChange,
  onRecipientNameChange, onRecipientPhoneChange, onBook,
  stops, onAddStop, onRemoveStop,
}: VehicleSelectStepProps) => {
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [showSplitFare, setShowSplitFare] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  const estimatedPrice = fareEstimate?.total_estimate || 0;

  // Safety score (simulated)
  const safetyScore = 4.8;

  return (
    <motion.div key="vehicle" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
      className="bg-card rounded-t-2xl relative z-30 border-t border-border/50">
      <div className="w-8 h-0.5 bg-muted rounded-full mx-auto mt-2 mb-1.5" />

      <div className="px-4 pb-4 space-y-2 max-h-[55vh] overflow-y-auto">
        {/* Route summary */}
        <div className="flex items-center gap-2.5 py-1">
          <div className="flex flex-col items-center gap-0">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-emerald-500/20"
            />
            {stops.map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-[1px] h-2 bg-border" />
                <div className="h-2 w-2 rounded-full border-[1.5px] border-amber-500 bg-amber-500/20" />
              </div>
            ))}
            <div className="w-[1px] h-4 bg-gradient-to-b from-emerald-500/50 to-primary/50" />
            <div className="h-2.5 w-2.5 rounded-sm border-2 border-primary bg-primary/20" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium truncate text-foreground">{pickupAddress || "Pickup"}</p>
            {stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-1 mt-0.5">
                <p className="text-[11px] text-amber-600 truncate flex-1">{stop.address || `Stop ${i + 1}`}</p>
                <button onClick={() => onRemoveStop(i)} className="p-0.5 hover:bg-destructive/10 rounded"><X className="h-2.5 w-2.5 text-destructive" /></button>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{dropoffAddress || "Destination"}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            {fareEstimate && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
                {fareEstimate.distance_km} km · ~{fareEstimate.duration_mins} min
              </Badge>
            )}
            <div className="flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-emerald-500/10">
              <Shield className="h-2.5 w-2.5 text-emerald-600" />
              <span className="text-[9px] font-bold text-emerald-700">{safetyScore}</span>
            </div>
          </div>
        </div>

        {/* Add stop + split fare */}
        <div className="flex gap-1.5">
          {stops.length < 3 && (
            <button
              onClick={onAddStop}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-secondary/50 text-[11px] text-muted-foreground font-medium press-effect hover:bg-secondary transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add stop
            </button>
          )}
          <button
            onClick={() => setShowSplitFare(!showSplitFare)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-medium press-effect transition-colors",
              showSplitFare ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            <Users className="h-3 w-3" />
            Split fare
          </button>
        </div>

        {/* Split fare panel */}
        <AnimatePresence>
          {showSplitFare && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Split between</span>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={splitCount <= 2}
                      onClick={() => setSplitCount(Math.max(2, splitCount - 1))}>
                      <span className="text-lg">−</span>
                    </Button>
                    <span className="text-2xl font-black text-primary w-8 text-center">{splitCount}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={splitCount >= 6}
                      onClick={() => setSplitCount(Math.min(6, splitCount + 1))}>
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Each person pays</span>
                  <span className="font-bold text-primary text-lg">{formatPrice(Math.ceil(estimatedPrice / splitCount))}</span>
                </div>
                <p className="text-2xs text-muted-foreground">Split payment links will be sent after booking</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Surge warning */}
        {surgeData && surgeData.multiplier > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 rounded-xl text-sm border border-destructive/20"
          >
            <Zap className="h-4 w-4 text-destructive" />
            <span className="font-semibold text-destructive">{surgeData.multiplier}x</span>
            <span className="text-destructive/70 text-xs truncate flex-1">{surgeData.reason || 'High demand in your area'}</span>
            <Badge variant="outline" className="text-2xs border-destructive/30 text-destructive">Live</Badge>
          </motion.div>
        )}

        {/* Pricing mode toggle */}
        <div className="flex gap-0.5 p-0.5 bg-secondary rounded-xl">
          <button
            onClick={() => onPricingModeChange('fixed')}
            className={cn("flex-1 py-2 rounded-lg text-[11px] font-bold transition-all press-effect flex items-center justify-center gap-1",
              pricingMode === 'fixed' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            )}>
            <Sparkles className="h-3 w-3" />
            Recommended
          </button>
          <button
            onClick={() => onPricingModeChange('negotiation')}
            className={cn("flex-1 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 press-effect",
              pricingMode === 'negotiation' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            )}>
            <TrendingDown className="h-3 w-3" />
            Name your price
          </button>
        </div>

        {/* Vehicle list */}
        <div className="space-y-1">
          {vehicles.map((v, index) => {
            const price = Math.round((fareEstimate?.total_estimate || 30) * v.multiplier / (vehicles[0].multiplier));
            const isSelected = selectedVehicle === v.id;
            const isBestValue = index === 0;
            const isMostComfort = index === 1;
            return (
              <motion.button
                key={v.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  onVehicleSelect(v.id);
                  if (pricingMode === 'negotiation') onOfferPriceChange(price);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all touch-manipulation press-effect relative overflow-hidden",
                  isSelected
                    ? "bg-primary/8 ring-[1.5px] ring-primary shadow-sm"
                    : "bg-secondary/50 hover:bg-secondary active:bg-secondary"
                )}>
                {isBestValue && (
                  <div className="absolute top-1 right-1">
                    <Badge className="text-[8px] bg-emerald-500/15 text-emerald-700 border-emerald-500/20 px-1 py-0 leading-tight">Best value</Badge>
                  </div>
                )}
                {isMostComfort && !isBestValue && (
                  <div className="absolute top-1 right-1">
                    <Badge className="text-[8px] bg-blue-500/15 text-blue-700 border-blue-500/20 px-1 py-0 leading-tight">Popular</Badge>
                  </div>
                )}

                <div className={cn(
                  "h-10 w-12 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary/15" : "bg-muted"
                )}>
                  <VehicleIcon type={v.id} isSelected={isSelected} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[13px] text-foreground">{v.name}</span>
                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" /> {v.eta} min
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" /> {v.seats}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn("font-black text-sm", isSelected ? "text-primary" : "text-foreground/80")}>
                    {formatPrice(price)}
                  </span>
                  {showSplitFare && (
                    <p className="text-[9px] text-primary font-medium">÷{splitCount} = {formatPrice(Math.ceil(price / splitCount))}</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Fare breakdown toggle */}
        {fareEstimate && pricingMode === 'fixed' && (
          <div>
            <button
              onClick={() => setShowFareBreakdown(!showFareBreakdown)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-primary font-semibold press-effect"
            >
              Fare breakdown
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFareBreakdown && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showFareBreakdown && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <FareBreakdownCard
                    fareEstimate={fareEstimate}
                    promoDiscount={appliedPromo?.discount || 0}
                    promoCode={appliedPromo?.promo_code_id}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* inDrive price slider - redesigned */}
        {pricingMode === 'negotiation' && fareEstimate && (() => {
          const minPrice = Math.round(fareEstimate.total_estimate * 0.5);
          const maxPrice = Math.round(fareEstimate.total_estimate * 3);
          const recommended = Math.round(fareEstimate.total_estimate);
          const priceStep = Math.max(1, Math.round(recommended * 0.05));
          const priceDiff = offerPrice - recommended;
          const pricePercent = Math.round((priceDiff / recommended) * 100);
          return (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="bg-gradient-to-b from-secondary to-secondary/50 rounded-2xl p-4 space-y-3 border border-border/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">Name your price</p>
                {priceDiff !== 0 && (
                  <Badge variant={priceDiff > 0 ? "default" : "secondary"} className="text-2xs">
                    {priceDiff > 0 ? `+${pricePercent}%` : `${pricePercent}%`} vs recommended
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-center gap-5">
                <Button variant="outline" size="icon"
                  className="h-14 w-14 rounded-2xl shrink-0 border-border press-effect text-xl font-bold"
                  disabled={offerPrice <= minPrice}
                  onClick={() => onOfferPriceChange(Math.max(minPrice, offerPrice - priceStep))}
                >−</Button>
                <div className="text-center min-w-[120px]">
                  <motion.span
                    key={offerPrice}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-black text-foreground block"
                  >
                    {formatPrice(offerPrice)}
                  </motion.span>
                  {offerPrice < recommended && (
                    <p className="text-2xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Lower offers may take longer to match
                    </p>
                  )}
                </div>
                <Button variant="outline" size="icon"
                  className="h-14 w-14 rounded-2xl shrink-0 border-border press-effect text-xl font-bold"
                  disabled={offerPrice >= maxPrice}
                  onClick={() => onOfferPriceChange(Math.min(maxPrice, offerPrice + priceStep))}
                >+</Button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatPrice(minPrice)}</span>
                <button onClick={() => onOfferPriceChange(recommended)} className="text-primary font-semibold press-effect">
                  Reset to {formatPrice(recommended)}
                </button>
                <span>{formatPrice(maxPrice)}</span>
              </div>
            </motion.div>
          );
        })()}

        {/* Promo code */}
        <PromoCodeInput
          orderAmount={estimatedPrice}
          onPromoApplied={(result) => setAppliedPromo(result)}
          onPromoRemoved={() => setAppliedPromo(null)}
          appliedPromo={appliedPromo}
        />

        {/* Book for someone else */}
        <button
          onClick={() => onBookingForOtherChange(!bookingForOther)}
          className={cn(
            "w-full flex items-center gap-3 p-3.5 rounded-2xl text-sm font-medium transition-all touch-manipulation press-effect",
            bookingForOther ? "bg-primary/10 ring-1 ring-primary" : "bg-secondary"
          )}>
          <UserPlus className={cn("h-4 w-4", bookingForOther ? "text-primary" : "text-muted-foreground")} />
          <span className="flex-1 text-left text-foreground">Book for someone else</span>
          {bookingForOther && <Check className="h-4 w-4 text-primary" />}
        </button>
        {bookingForOther && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="space-y-2">
            <Input placeholder="Recipient's name" value={recipientName}
              onChange={(e) => onRecipientNameChange(e.target.value)} className="h-12 rounded-xl text-base" />
            <Input placeholder="Recipient's phone number" type="tel" value={recipientPhone}
              onChange={(e) => onRecipientPhoneChange(e.target.value)} className="h-12 rounded-xl text-base" />
            <p className="text-xs text-muted-foreground px-1">The driver will contact this person for pickup</p>
          </motion.div>
        )}

        {/* Payment method - redesigned */}
        <div className="flex gap-1.5">
          {([
            { id: 'cash' as const, icon: Banknote, label: 'Cash', color: 'text-emerald-600' },
            { id: 'card' as const, icon: CreditCard, label: 'Card', color: 'text-blue-600' },
            { id: 'wallet' as const, icon: Wallet, label: 'Wallet', color: 'text-purple-600' },
          ] as const).map(pm => (
            <button key={pm.id}
              onClick={() => onPaymentMethodChange(pm.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-bold transition-all touch-manipulation press-effect border-2",
                paymentMethod === pm.id
                  ? "bg-foreground text-background border-foreground shadow-lg"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
              )}>
              <pm.icon className="h-4 w-4" />
              {pm.label}
            </button>
          ))}
        </div>

        {/* Book CTA - enhanced with safety + social proof */}
        <div className="space-y-2">
          <Button
            className="w-full h-14 rounded-2xl text-base font-black press-effect shadow-super relative overflow-hidden"
            disabled={isBooking || !dropoffAddress || (bookingForOther && (!recipientName || !recipientPhone))}
            onClick={onBook}
          >
            {isBooking ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" />Finding drivers...</>
            ) : pricingMode === 'negotiation' ? (
              `Offer ${formatPrice(offerPrice)}`
            ) : (
              `Book ${vehicles.find(v => v.id === selectedVehicle)?.name || 'Ride'} · ${formatPrice(Math.round(estimatedPrice - (appliedPromo?.discount || 0)))}`
            )}
          </Button>
          <div className="flex items-center justify-center gap-4 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-500" />PIN verified</span>
            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />Rated drivers</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-pink-500" />Insured trips</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
