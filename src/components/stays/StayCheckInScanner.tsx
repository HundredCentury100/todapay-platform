import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, Search, CheckCircle, AlertCircle, User, 
  Calendar, BedDouble, Home, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import CameraQRScanner from "@/components/CameraQRScanner";

interface CheckedInBooking {
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  roomName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  numRooms: number;
  specialRequests?: string;
}

interface StayCheckInScannerProps {
  onCheckInComplete?: () => void;
}

const StayCheckInScanner = ({ onCheckInComplete }: StayCheckInScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [manualReference, setManualReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkedInBooking, setCheckedInBooking] = useState<CheckedInBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processCheckIn = async (qrCodeData?: string, bookingReference?: string) => {
    setLoading(true);
    setError(null);
    setCheckedInBooking(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please log in to check in guests");
      }

      const { data, error: fnError } = await supabase.functions.invoke('check-in-stay', {
        body: {
          qrCodeData,
          bookingReference,
          checkedInBy: session.user.email,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        setError(data.error);
        toast.error(data.error);
        return;
      }

      setCheckedInBooking(data.booking);
      toast.success("Guest checked in successfully!");
      onCheckInComplete?.();
    } catch (err: any) {
      console.error("Check-in error:", err);
      const errorMessage = err.message || "Failed to check in guest";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleQRCodeScan = (result: string) => {
    if (result) {
      processCheckIn(result, undefined);
    }
  };

  const handleManualSearch = () => {
    if (!manualReference.trim()) {
      toast.error("Please enter a booking reference");
      return;
    }
    processCheckIn(undefined, manualReference.trim());
  };

  const resetScanner = () => {
    setCheckedInBooking(null);
    setError(null);
    setManualReference("");
  };

  return (
    <div className="space-y-6">
      {/* Success State */}
      {checkedInBooking && (
        <Card className="border-green-500 bg-green-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Check-In Successful
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetScanner}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Guest</p>
                  <p className="font-medium">{checkedInBooking.guestName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-medium">{checkedInBooking.propertyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{checkedInBooking.roomName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Stay</p>
                  <p className="font-medium">
                    {format(new Date(checkedInBooking.checkInDate), "MMM d")} - {format(new Date(checkedInBooking.checkOutDate), "MMM d")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{checkedInBooking.numGuests} Guest(s)</Badge>
              <Badge variant="outline">{checkedInBooking.numRooms} Room(s)</Badge>
              <Badge variant="outline" className="capitalize">{checkedInBooking.roomType?.replace('_', ' ')}</Badge>
            </div>
            {checkedInBooking.specialRequests && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Special Requests:</p>
                <p className="text-sm italic">"{checkedInBooking.specialRequests}"</p>
              </div>
            )}
            <Button onClick={resetScanner} className="w-full">
              Check In Another Guest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !checkedInBooking && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button variant="outline" onClick={resetScanner} className="mt-4 w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scanner/Search State */}
      {!checkedInBooking && !error && (
        <>
          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan Guest QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanning ? (
                <div className="space-y-4">
                  <CameraQRScanner
                    onScan={handleQRCodeScan}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setScanning(false)} 
                    className="w-full"
                  >
                    Cancel Scanning
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setScanning(true)} 
                  className="w-full"
                  disabled={loading}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Start QR Scanner
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Manual Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search by Booking Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingRef">Booking Reference</Label>
                <Input
                  id="bookingRef"
                  placeholder="Enter booking reference (e.g., ABC123)"
                  value={manualReference}
                  onChange={(e) => setManualReference(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
              </div>
              <Button 
                onClick={handleManualSearch} 
                className="w-full"
                disabled={loading || !manualReference.trim()}
              >
                {loading ? "Checking In..." : "Check In Guest"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StayCheckInScanner;
