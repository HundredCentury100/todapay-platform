import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCheck, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CheckOutResult {
  success: boolean;
  message: string;
  booking?: {
    booking_reference: string;
    passenger_name: string;
    item_name: string;
    event_date?: string;
    event_time?: string;
    category_specific_data?: any;
  };
  checkOut?: {
    checked_out_at: string;
    picked_up_by: string;
  };
  error?: string;
}

export const CheckOutScanner = () => {
  const [qrCodeData, setQrCodeData] = useState("");
  const [pickedUpBy, setPickedUpBy] = useState("");
  const [relationshipToStudent, setRelationshipToStudent] = useState("");
  const [idVerified, setIdVerified] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckOutResult | null>(null);

  const handleCheckOut = async () => {
    if (!qrCodeData.trim()) {
      toast.error("Please enter QR code data or booking reference");
      return;
    }

    if (!pickedUpBy.trim()) {
      toast.error("Please enter the name of the person picking up the student");
      return;
    }

    if (!idVerified) {
      toast.error("Please verify the ID of the person picking up");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // First, find the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .or(`booking_reference.eq.${qrCodeData},qr_code_data.eq.${qrCodeData}`)
        .single();

      if (bookingError || !bookingData) {
        setResult({
          success: false,
          message: "Booking not found",
          error: "Invalid QR code or booking reference"
        });
        toast.error("Booking not found");
        setLoading(false);
        return;
      }

      // Check if already checked out
      const { data: existingCheckOut } = await supabase
        .from("check_outs")
        .select("*")
        .eq("booking_id", bookingData.id)
        .single();

      if (existingCheckOut) {
        setResult({
          success: false,
          message: "Student already checked out",
          booking: bookingData,
          checkOut: existingCheckOut,
          error: `Already checked out at ${new Date(existingCheckOut.checked_out_at).toLocaleString()}`
        });
        toast.error("Student already checked out");
        setLoading(false);
        return;
      }

      // Check if student was checked in
      if (!bookingData.checked_in) {
        setResult({
          success: false,
          message: "Student was not checked in",
          booking: bookingData,
          error: "Cannot check out a student who was not checked in"
        });
        toast.error("Student was not checked in to this event");
        setLoading(false);
        return;
      }

      // Create check-out record
      const { data: checkOutData, error: checkOutError } = await supabase
        .from("check_outs")
        .insert({
          booking_id: bookingData.id,
          picked_up_by: pickedUpBy,
          relationship_to_student: relationshipToStudent,
          id_verified: idVerified,
          notes: notes
        })
        .select()
        .single();

      if (checkOutError) {
        throw checkOutError;
      }

      setResult({
        success: true,
        message: "Student successfully checked out",
        booking: bookingData,
        checkOut: checkOutData
      });

      toast.success(`${bookingData.passenger_name} checked out successfully`);

      // Send notification to parent (you can implement this via edge function)
      // await supabase.functions.invoke('send-checkout-notification', {
      //   body: { bookingId: bookingData.id, pickedUpBy }
      // });

    } catch (error: any) {
      console.error("Check-out error:", error);
      setResult({
        success: false,
        message: "Check-out failed",
        error: error.message
      });
      toast.error("Check-out failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQrCodeData("");
    setPickedUpBy("");
    setRelationshipToStudent("");
    setIdVerified(false);
    setNotes("");
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Student Check-Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qrCode">QR Code / Booking Reference *</Label>
            <Input
              id="qrCode"
              value={qrCodeData}
              onChange={(e) => setQrCodeData(e.target.value)}
              placeholder="Scan QR code or enter booking reference"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="pickedUpBy">Picked Up By (Full Name) *</Label>
            <Input
              id="pickedUpBy"
              value={pickedUpBy}
              onChange={(e) => setPickedUpBy(e.target.value)}
              placeholder="Name of person picking up the student"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="relationship">Relationship to Student</Label>
            <Input
              id="relationship"
              value={relationshipToStudent}
              onChange={(e) => setRelationshipToStudent(e.target.value)}
              placeholder="e.g., Mother, Father, Guardian"
              disabled={loading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="idVerified"
              checked={idVerified}
              onCheckedChange={(checked) => setIdVerified(checked as boolean)}
              disabled={loading}
            />
            <Label htmlFor="idVerified" className="font-normal">
              I have verified the ID of the person picking up the student *
            </Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleCheckOut} 
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Out Student
            </Button>
            {result && (
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.success ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Check-Out Successful
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Check-Out Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium">{result.message}</p>
            
            {result.booking && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">{result.booking.passenger_name}</span>
                  
                  <span className="text-muted-foreground">Booking Ref:</span>
                  <span className="font-medium">{result.booking.booking_reference}</span>
                  
                  <span className="text-muted-foreground">Event:</span>
                  <span>{result.booking.item_name}</span>

                  {result.booking.category_specific_data?.grade && (
                    <>
                      <span className="text-muted-foreground">Grade:</span>
                      <span>{result.booking.category_specific_data.grade}</span>
                    </>
                  )}
                </div>

                {result.checkOut && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    <p className="font-medium text-green-700 dark:text-green-300">
                      Checked out at: {new Date(result.checkOut.checked_out_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Picked up by: {result.checkOut.picked_up_by}
                    </p>
                  </div>
                )}
              </div>
            )}

            {result.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
