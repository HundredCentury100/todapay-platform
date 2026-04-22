import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, MapPin, Car, User, Calendar, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";

interface TransferShareCardProps {
  transferId: string;
  shareCode?: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDatetime?: string | null;
  driverName?: string;
  vehicleInfo?: string;
  licensePlate?: string;
  price?: number;
  passengerName?: string;
}

export const TransferShareCard = ({
  transferId,
  shareCode,
  pickupLocation,
  dropoffLocation,
  scheduledDatetime,
  driverName,
  vehicleInfo,
  licensePlate,
  price,
  passengerName,
}: TransferShareCardProps) => {
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const trackingUrl = `${window.location.origin}/track/${shareCode || transferId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Transfer Details',
          text: `Transfer: ${pickupLocation} → ${dropoffLocation}${driverName ? ` | Driver: ${driverName}` : ''}`,
          url: trackingUrl,
        });
      } catch {
        await navigator.clipboard.writeText(trackingUrl);
        toast.success("Link copied!");
      }
    } else {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success("Link copied!");
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `transfer-${shareCode || transferId.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Card saved!");
    } catch {
      toast.error("Failed to generate card");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Shareable card */}
      <div ref={cardRef}>
        <Card className="rounded-2xl overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70">
          <CardContent className="p-5 text-primary-foreground space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-sm">FulTicket Transfer</p>
                  <p className="text-[10px] opacity-80">Booking Confirmation</p>
                </div>
              </div>
              {price && (
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm font-bold">
                  ${price}
                </Badge>
              )}
            </div>

            {/* Route */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <div className="w-0.5 h-8 bg-primary-foreground/30" />
                <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-[10px] opacity-60">PICKUP</p>
                  <p className="text-sm font-medium leading-tight">{pickupLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-60">DROPOFF</p>
                  <p className="text-sm font-medium leading-tight">{dropoffLocation}</p>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {passengerName && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 opacity-60" />
                  <div>
                    <p className="text-[9px] opacity-50">PASSENGER</p>
                    <p className="text-xs font-medium">{passengerName}</p>
                  </div>
                </div>
              )}
              {driverName && (
                <div className="flex items-center gap-2">
                  <Car className="h-3.5 w-3.5 opacity-60" />
                  <div>
                    <p className="text-[9px] opacity-50">DRIVER</p>
                    <p className="text-xs font-medium">{driverName}</p>
                  </div>
                </div>
              )}
              {vehicleInfo && (
                <div>
                  <p className="text-[9px] opacity-50">VEHICLE</p>
                  <p className="text-xs font-medium">{vehicleInfo}</p>
                </div>
              )}
              {licensePlate && (
                <div>
                  <p className="text-[9px] opacity-50">PLATE</p>
                  <p className="text-xs font-bold">{licensePlate}</p>
                </div>
              )}
            </div>

            {/* QR + date */}
            <div className="flex items-end justify-between pt-2 border-t border-primary-foreground/20">
              <div>
                {scheduledDatetime && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3 w-3 opacity-60" />
                    <p className="text-xs">
                      {new Date(scheduledDatetime).toLocaleDateString('en-ZW', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                <p className="text-[9px] opacity-50">Scan to track live</p>
              </div>
              <div className="bg-white p-1.5 rounded-lg">
                <QRCode value={trackingUrl} size={56} level="M" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2 rounded-xl"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 rounded-xl"
          onClick={handleDownload}
          disabled={generating}
        >
          <Download className="h-4 w-4" /> {generating ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};
