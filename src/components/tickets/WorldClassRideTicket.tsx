import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import QRCode from "react-qr-code";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Download,
  Share2,
  Copy,
  Smartphone,
  CheckCircle2,
  Car,
  MapPin,
  Navigation,
  Clock,
  Route,
  Star,
  User,
  CreditCard,
  Banknote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { TicketPurchaseDetails } from "./TicketPurchaseDetails";

interface RideDetails {
  id: string;
  receipt_number: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string | null;
  dropoff_time: string | null;
  distance_km: number | null;
  duration_mins: number | null;
  driver_name: string;
  driver_photo?: string;
  driver_rating?: number;
  vehicle_type?: string;
  vehicle_plate?: string;
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  surge_amount: number;
  tip_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  passenger_name: string;
  passenger_email?: string;
  created_at: string;
}

interface WorldClassRideTicketProps {
  ride: RideDetails;
  onDownloadPDF: () => void;
  onDownloadWallet?: () => void;
}

export const WorldClassRideTicket = ({
  ride,
  onDownloadPDF,
  onDownloadWallet
}: WorldClassRideTicketProps) => {
  const { convertPrice } = useCurrency();
  const { toast } = useToast();

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    try {
      return format(parseISO(dateStr), 'HH:mm');
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ride.receipt_number);
    toast({ title: "Copied!", description: "Receipt number copied" });
  };

  const handleShare = async () => {
    const text = `🚗 Ride Receipt\n${ride.pickup_address} → ${ride.dropoff_address}\n${formatDate(ride.created_at)}\nTotal: $${ride.total_amount.toFixed(2)}\nReceipt: ${ride.receipt_number}\n\nvia todapayments.com`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ride Receipt', text });
      } catch {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    }
  };

  const getPaymentIcon = () => {
    if (ride.payment_method === 'cash') {
      return <Banknote className="h-3 w-3" />;
    }
    return <CreditCard className="h-3 w-3" />;
  };

  return (
    <motion.div 
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 border-2 print:border shadow-lg">
        {/* Perforated Edge Effect */}
        <div className="absolute left-0 top-1/2 w-3 h-6 bg-background rounded-r-full -translate-y-1/2 -translate-x-1/2 border-r-2 border-dashed border-muted-foreground/20" />
        <div className="absolute right-0 top-1/2 w-3 h-6 bg-background rounded-l-full -translate-y-1/2 translate-x-1/2 border-l-2 border-dashed border-muted-foreground/20" />

        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-sm">RIDE RECEIPT</p>
                <p className="text-[10px] opacity-80">fulticket</p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white text-[10px] px-2 py-0.5 border-0">
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
              COMPLETED
            </Badge>
          </div>
        </div>

        {/* Route Section */}
        <div className="bg-emerald-500/5 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="space-y-3">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow" />
                <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-red-500 my-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase">Pickup</p>
                <p className="text-sm font-medium truncate">{ride.pickup_address}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime(ride.pickup_time)}</p>
              </div>
            </div>
            
            {/* Dropoff */}
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase">Dropoff</p>
                <p className="text-sm font-medium truncate">{ride.dropoff_address}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime(ride.dropoff_time)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Number Row */}
        <div className="px-4 py-2 bg-muted/50 flex items-center justify-between border-b border-dashed border-muted-foreground/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Receipt No.</p>
            <p className="font-mono font-bold text-base tracking-wide">{ride.receipt_number}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0 print:hidden">
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Trip Stats Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Route className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Distance</p>
            <p className="font-bold text-sm">{ride.distance_km?.toFixed(1) || 0} km</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
            <p className="font-bold text-sm">{ride.duration_mins || 0} min</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <Car className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <p className="text-[10px] text-muted-foreground uppercase">Vehicle</p>
            <p className="font-bold text-sm capitalize">{ride.vehicle_type || 'Standard'}</p>
          </div>
        </div>

        {/* Driver Info */}
        <div className="px-4 py-3 border-b border-dashed border-muted-foreground/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              {ride.driver_photo ? (
                <img 
                  src={ride.driver_photo} 
                  alt={ride.driver_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{ride.driver_name}</p>
              <div className="flex items-center gap-2">
                {ride.driver_rating && (
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] text-muted-foreground">{ride.driver_rating.toFixed(1)}</span>
                  </div>
                )}
                {ride.vehicle_plate && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {ride.vehicle_plate}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="px-4 py-3 space-y-2 border-b border-dashed border-muted-foreground/20">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Fare Breakdown</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Base fare</span>
              <span>{convertPrice(ride.base_fare)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Distance ({ride.distance_km?.toFixed(1) || 0} km)</span>
              <span>{convertPrice(ride.distance_fare)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Time ({ride.duration_mins || 0} min)</span>
              <span>{convertPrice(ride.time_fare)}</span>
            </div>
            {ride.surge_amount > 0 && (
              <div className="flex justify-between text-xs text-orange-600">
                <span>Surge pricing</span>
                <span>+{convertPrice(ride.surge_amount)}</span>
              </div>
            )}
            {ride.tip_amount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Driver tip</span>
                <span>+{convertPrice(ride.tip_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Details */}
        <TicketPurchaseDetails
          purchaseChannel="online"
          paymentMethod={ride.payment_method}
          purchasedAt={ride.created_at}
        />

        {/* QR Code & Total */}
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
            <QRCode
              value={JSON.stringify({
                receipt: ride.receipt_number,
                type: 'RIDE',
                amount: ride.total_amount,
                date: ride.created_at,
                platform: 'fulticket'
              })}
              size={70}
              level="M"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground uppercase">Total Amount</p>
            <p className="font-bold text-2xl text-emerald-600">{convertPrice(ride.total_amount)}</p>
            <div className="flex items-center gap-1 mt-1">
              {getPaymentIcon()}
              <span className="text-[10px] text-muted-foreground capitalize">{ride.payment_method}</span>
              <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {ride.payment_status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Passenger Info */}
        <div className="px-4 py-2 bg-muted/30 border-t border-dashed border-muted-foreground/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Passenger</p>
              <p className="text-xs font-medium">{ride.passenger_name}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{formatDate(ride.created_at)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-4 py-2 border-t">
          <p className="text-[9px] text-muted-foreground text-center">
            🚗 Thank you for riding with us! • todapayments.com
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3 print:hidden">
        <Button onClick={onDownloadPDF} size="sm" className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700">
          <Download className="h-3 w-3 mr-1" />
          <span className="text-xs">PDF</span>
        </Button>
        {onDownloadWallet && (
          <Button onClick={onDownloadWallet} variant="outline" size="sm" className="flex-1 h-9">
            <Smartphone className="h-3 w-3 mr-1" />
            <span className="text-xs">Wallet</span>
          </Button>
        )}
        <Button onClick={handleShare} variant="outline" size="sm" className="flex-1 h-9">
          <Share2 className="h-3 w-3 mr-1" />
          <span className="text-xs">Share</span>
        </Button>
      </div>
    </motion.div>
  );
};

export default WorldClassRideTicket;
