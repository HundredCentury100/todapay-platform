import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, ScanLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraQRScanner from "./CameraQRScanner";
import { useIsMobile } from "@/hooks/use-mobile";

interface CheckInResult {
  success: boolean;
  message: string;
  booking?: {
    bookingReference: string;
    passengerName: string;
    itemName: string;
    eventDate: string;
    eventTime: string;
    eventVenue: string;
    ticketQuantity: number;
    selectedSeats?: string[];
  };
  error?: string;
  checkedInAt?: string;
}

const CheckInScanner = () => {
  const [qrCodeData, setQrCodeData] = useState("");
  const [location, setLocation] = useState("");
  const [checkedInBy, setCheckedInBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleCheckIn = async (scannedData?: string) => {
    const dataToUse = scannedData || qrCodeData;
    
    if (!dataToUse.trim()) {
      toast({
        title: "QR Code Required",
        description: "Please enter or scan the QR code data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-in-event', {
        body: {
          qrCodeData: dataToUse.trim(),
          location: location.trim() || undefined,
          checkedInBy: checkedInBy.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      if (error) {
        console.error('Check-in error:', error);
        setResult({
          success: false,
          message: error.message || 'Check-in failed',
          error: error.message,
        });
        toast({
          title: "Check-in Failed",
          description: error.message || "Failed to check in ticket",
          variant: "destructive",
        });
        return;
      }

      setResult(data);

      if (data.success) {
        toast({
          title: "Check-in Successful",
          description: `${data.booking?.passengerName} checked in successfully`,
        });
        // Clear the form
        setQrCodeData("");
        setNotes("");
      } else {
        toast({
          title: "Check-in Failed",
          description: data.error || data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setResult({
        success: false,
        message: 'Network error. Please try again.',
        error: String(error),
      });
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQrCodeData("");
    setNotes("");
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={isMobile ? "camera" : "manual"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera">Camera Scan</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        
        <TabsContent value="camera" className="space-y-4">
          <CameraQRScanner onScan={handleCheckIn} isScanning={isLoading} />
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <ScanLine className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Event Check-In</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="qrCode">QR Code Data *</Label>
                <Input
                  id="qrCode"
                  value={qrCodeData}
                  onChange={(e) => setQrCodeData(e.target.value)}
                  placeholder="Enter QR code data"
                  disabled={isLoading}
                />
              </div>

          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Entrance"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="checkedInBy">Checked In By (Optional)</Label>
            <Input
              id="checkedInBy"
              value={checkedInBy}
              onChange={(e) => setCheckedInBy(e.target.value)}
              placeholder="Staff name"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={2}
              disabled={isLoading}
            />
          </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleCheckIn()}
                  disabled={isLoading || !qrCodeData.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    "Check In"
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isLoading}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {result && (
        <Card className={`p-6 ${result.success ? 'border-primary' : 'border-destructive'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-primary' : 'text-destructive'}`}>
                {result.success ? "Check-In Successful" : "Check-In Failed"}
              </h3>
              
              {result.booking && (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Booking:</span> <span className="font-mono">{result.booking.bookingReference}</span></p>
                  <p><span className="text-muted-foreground">Guest:</span> {result.booking.passengerName}</p>
                  <p><span className="text-muted-foreground">Event:</span> {result.booking.itemName}</p>
                  <p><span className="text-muted-foreground">Date:</span> {new Date(result.booking.eventDate).toLocaleDateString()}</p>
                  <p><span className="text-muted-foreground">Time:</span> {result.booking.eventTime}</p>
                  <p><span className="text-muted-foreground">Venue:</span> {result.booking.eventVenue}</p>
                  <p><span className="text-muted-foreground">Tickets:</span> {result.booking.ticketQuantity}</p>
                  {result.booking.selectedSeats && result.booking.selectedSeats.length > 0 && (
                    <p><span className="text-muted-foreground">Seats:</span> {result.booking.selectedSeats.join(", ")}</p>
                  )}
                </div>
              )}

              {result.error && (
                <p className="text-sm text-muted-foreground mt-2">{result.error}</p>
              )}

              {result.checkedInAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Already checked in at: {new Date(result.checkedInAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CheckInScanner;
