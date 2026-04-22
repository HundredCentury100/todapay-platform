import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Phone, MessageSquare, Shield, 
  Share2, Star, User, X, Plane, Users, Briefcase,
  MapPin, Clock, Navigation, CheckCircle2
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TransferRatingModal } from "@/components/transfers/TransferRatingModal";
import { CancelTransferModal } from "@/components/transfers/CancelTransferModal";
import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TransferTimeline } from "@/components/transfers/TransferTimeline";
import { DriverProfileCard } from "@/components/transfers/DriverProfileCard";
import { TransferShareCard } from "@/components/transfers/TransferShareCard";
import { FlightStatusBanner } from "@/components/transfers/FlightStatusBanner";

// Haversine formula for ETA calculation
const calculateETA = (
  driverLat: number | null, driverLng: number | null,
  destLat: number | null, destLng: number | null
): number | null => {
  if (!driverLat || !driverLng || !destLat || !destLng) return null;
  const R = 6371;
  const dLat = ((destLat - driverLat) * Math.PI) / 180;
  const dLng = ((destLng - driverLng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((driverLat * Math.PI) / 180) * Math.cos((destLat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distKm = R * c;
  return Math.max(1, Math.round((distKm / 40) * 60));
};

type TransferStatus = 
  | 'pending' | 'confirmed' | 'driver_assigned' 
  | 'driver_en_route' | 'driver_arrived' | 'in_progress' 
  | 'completed' | 'cancelled';

interface TransferData {
  id: string;
  status: TransferStatus;
  booking_type: string;
  service_type: string;
  vehicle_category: string;
  pickup_location: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_location: string;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  scheduled_datetime: string | null;
  price_quoted: number | null;
  price_final: number | null;
  num_passengers: number;
  num_luggage: number | null;
  flight_number: string | null;
  meet_and_greet: boolean | null;
  share_code: string | null;
  driver_current_lat: number | null;
  driver_current_lng: number | null;
  assigned_driver_id: string | null;
  passenger_name: string | null;
  driver?: {
    id: string;
    full_name: string;
    phone: string | null;
    rating: number | null;
    total_rides: number | null;
    profile_photo_url: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_color: string | null;
    license_plate: string | null;
  };
}

const STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; icon: typeof Car }> = {
  pending: { label: "Finding driver...", color: "bg-amber-500", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500", icon: CheckCircle2 },
  driver_assigned: { label: "Driver assigned", color: "bg-blue-500", icon: Car },
  driver_en_route: { label: "Driver on the way", color: "bg-blue-500", icon: Navigation },
  driver_arrived: { label: "Driver arrived!", color: "bg-green-500", icon: MapPin },
  in_progress: { label: "Trip in progress", color: "bg-primary", icon: Car },
  completed: { label: "Completed", color: "bg-green-600", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive", icon: X },
};

const TransferTracking = () => {
  const { transferId } = useParams();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [transfer, setTransfer] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [expandedSheet, setExpandedSheet] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (!transferId) return;

    const fetchTransfer = async () => {
      const { data, error } = await supabase
        .from('transfer_requests')
        .select(`
          *,
          driver:drivers(
            id, full_name, phone, rating, total_rides,
            profile_photo_url, vehicle_make, vehicle_model,
            vehicle_color, license_plate
          )
        `)
        .eq('id', transferId)
        .single();
      
      if (error) {
        toast.error("Transfer not found");
        navigate('/orders');
        return;
      }
      
      setTransfer(data as unknown as TransferData);
      setLoading(false);
      if (data.status === 'completed') setShowRatingModal(true);
    };

    fetchTransfer();

    const channel = supabase
      .channel(`transfer-${transferId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'transfer_requests',
        filter: `id=eq.${transferId}`
      }, async (payload) => {
        const newData = payload.new as any;
        const oldStatus = transfer?.status;
        const newStatus = newData.status;
        
        if (newData.assigned_driver_id) {
          const { data: driverData } = await supabase
            .from('drivers')
            .select('id, full_name, phone, rating, total_rides, profile_photo_url, vehicle_make, vehicle_model, vehicle_color, license_plate')
            .eq('id', newData.assigned_driver_id)
            .single();
          setTransfer({ ...newData, driver: driverData } as TransferData);
        } else {
          setTransfer(newData as TransferData);
        }

        if (oldStatus !== newStatus && 'vibrate' in navigator) {
          if (newStatus === 'driver_arrived') {
            navigator.vibrate([200, 100, 200]);
            toast.success("Your driver has arrived!", { description: "Head to the pickup point" });
          } else if (newStatus === 'in_progress') {
            navigator.vibrate(100);
            toast.info("Transfer started", { description: "Enjoy your trip!" });
          } else if (newStatus === 'completed') {
            navigator.vibrate([100, 50, 100, 50, 200]);
            setShowRatingModal(true);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [transferId, navigate]);

  const handleShareTransfer = () => setShowShareCard(!showShareCard);
  const handleRatingClose = () => { setShowRatingModal(false); navigate('/orders'); };
  const handleCancelled = () => navigate('/transfers');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!transfer) return null;

  const status = transfer.status as TransferStatus;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const driver = transfer.driver;
  const canCancel = ['pending', 'confirmed', 'driver_assigned', 'driver_en_route'].includes(status);

  return (
    <div className="min-h-screen bg-background safe-area-pt relative">
      {/* Map Background */}
      <div className="absolute inset-0">
        {transfer.pickup_lat && transfer.pickup_lng && transfer.dropoff_lat && transfer.dropoff_lng ? (
          <LiveTrackingMap
            pickupCoords={{ lat: transfer.pickup_lat, lng: transfer.pickup_lng }}
            dropoffCoords={{ lat: transfer.dropoff_lat, lng: transfer.dropoff_lng }}
            driverCoords={transfer.driver_current_lat && transfer.driver_current_lng 
              ? { lat: transfer.driver_current_lat, lng: transfer.driver_current_lng } : null}
            pickupAddress={transfer.pickup_location}
            dropoffAddress={transfer.dropoff_location}
            driverName={driver?.full_name}
            vehicleInfo={driver ? `${driver.vehicle_make} ${driver.vehicle_model}` : undefined}
            etaMinutes={(() => {
              const eta = calculateETA(transfer.driver_current_lat, transfer.driver_current_lng,
                transfer.pickup_lat, transfer.pickup_lng);
              return ['driver_en_route', 'driver_assigned'].includes(status) ? (eta ?? undefined) : undefined;
            })()}
            status={statusConfig.label}
            className="h-full w-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-muted/30 via-muted/10 to-background">
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
        <BackButton fallbackPath="/orders" className="h-12 w-12 rounded-2xl bg-background/90 shadow-lg" />
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-background/90 shadow-lg"
            onClick={handleShareTransfer}>
            <Share2 className="h-5 w-5" />
          </Button>
          {canCancel && (
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-destructive/10 shadow-lg text-destructive"
              onClick={() => setShowCancelModal(true)}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="relative z-10 flex justify-center mt-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Badge className={cn("px-6 py-2 text-base rounded-full shadow-lg text-white", statusConfig.color)}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {statusConfig.label}
          </Badge>
        </motion.div>
      </div>

      {/* Flight Status Banner */}
      {transfer.flight_number && (
        <div className="relative z-10 px-4 mt-4">
          <FlightStatusBanner
            flightNumber={transfer.flight_number}
            scheduledTime={transfer.scheduled_datetime || undefined}
          />
        </div>
      )}

      {/* Share Card Overlay */}
      <AnimatePresence>
        {showShareCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-30 px-4 mt-4"
          >
            <TransferShareCard
              transferId={transfer.id}
              shareCode={transfer.share_code}
              pickupLocation={transfer.pickup_location}
              dropoffLocation={transfer.dropoff_location}
              scheduledDatetime={transfer.scheduled_datetime}
              driverName={driver?.full_name}
              vehicleInfo={driver ? `${driver.vehicle_color} ${driver.vehicle_make} ${driver.vehicle_model}` : undefined}
              licensePlate={driver?.license_plate || undefined}
              price={transfer.price_final || transfer.price_quoted || undefined}
              passengerName={transfer.passenger_name || undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <motion.div className="absolute bottom-0 left-0 right-0 z-20" initial={{ y: 100 }} animate={{ y: 0 }}>
        <div className={cn(
          "bg-background rounded-t-[2rem] shadow-2xl transition-all duration-300",
          expandedSheet ? "min-h-[75vh]" : "min-h-[45vh]"
        )}>
          <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setExpandedSheet(!expandedSheet)}>
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          <div className="px-4 space-y-4 pb-8 overflow-y-auto max-h-[70vh]">
            {/* Driver Card - Enhanced */}
            {driver ? (
              <DriverProfileCard
                driver={{
                  ...driver,
                  phone: driver.phone,
                  is_verified: true,
                }}
                compact={!expandedSheet}
                showActions={true}
              />
            ) : (
              <Card className="rounded-2xl border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="animate-pulse">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Finding your driver...</p>
                    <p className="text-sm text-muted-foreground mt-1">This usually takes 1-3 minutes</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transfer Timeline */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Trip Progress</h4>
                <TransferTimeline currentStatus={status} />
              </CardContent>
            </Card>

            {/* Transfer Details */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{transfer.num_passengers}</span>
                  </div>
                  {transfer.num_luggage && transfer.num_luggage > 0 && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{transfer.num_luggage}</span>
                    </div>
                  )}
                  <Badge variant="outline" className="capitalize ml-auto">
                    {transfer.vehicle_category.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <div className="w-0.5 h-10 bg-gradient-to-b from-green-500 to-primary" />
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="font-medium">{transfer.pickup_location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{transfer.dropoff_location}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price & ETA */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated fare</p>
                  <p className="text-2xl font-bold">
                    {convertPrice(transfer.price_final || transfer.price_quoted || 0)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary" className="capitalize">
                    {transfer.service_type.replace(/_/g, ' ')}
                  </Badge>
                  {(() => {
                    const eta = calculateETA(
                      transfer.driver_current_lat, transfer.driver_current_lng,
                      transfer.pickup_lat, transfer.pickup_lng
                    );
                    if (eta && ['driver_en_route', 'driver_assigned'].includes(status)) {
                      return (
                        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200" variant="outline">
                          <Clock className="h-3 w-3 mr-1" />{eta} min away
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Safety Features */}
            <AnimatePresence>
              {expandedSheet && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Safety Features Active</p>
                          <p className="text-sm text-muted-foreground">Trip is being monitored</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Protected</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Rating Modal */}
      {transfer && (
        <TransferRatingModal
          open={showRatingModal} onClose={handleRatingClose}
          transferId={transfer.id} driverName={driver?.full_name || 'Driver'}
          driverPhoto={driver?.profile_photo_url} finalPrice={transfer.price_final || transfer.price_quoted || 0}
        />
      )}

      {/* Cancel Modal */}
      <CancelTransferModal
        open={showCancelModal} onOpenChange={setShowCancelModal}
        transferId={transferId} onCancelled={handleCancelled}
      />
    </div>
  );
};

export default TransferTracking;
