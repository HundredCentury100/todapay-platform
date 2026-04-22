import { useState } from "react";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkBooking {
  row: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  booking_type: string;
  item_name: string;
  travel_date: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function AgentBulkBookingPage() {
  const { merchantProfile } = useMerchantAuth();
  const [file, setFile] = useState<File | null>(null);
  const [bookings, setBookings] = useState<BulkBooking[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadTemplate = () => {
    const csvContent = [
      "client_name,client_email,client_phone,booking_type,item_name,travel_date,seats,quantity",
      "John Doe,john@example.com,+263123456789,bus,Johannesburg to Harare,2025-02-01,A1|A2,2",
      "Jane Smith,jane@example.com,+263987654321,event,Music Festival,2025-02-15,,3"
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_booking_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",");
      
      const parsedBookings: BulkBooking[] = lines.slice(1).map((line, index) => {
        const values = line.split(",");
        return {
          row: index + 2,
          client_name: values[0]?.trim() || "",
          client_email: values[1]?.trim() || "",
          client_phone: values[2]?.trim(),
          booking_type: values[3]?.trim() || "",
          item_name: values[4]?.trim() || "",
          travel_date: values[5]?.trim() || "",
          status: 'pending' as const
        };
      });

      setBookings(parsedBookings);
    };
    reader.readAsText(file);
  };

  const processBookings = async () => {
    if (!merchantProfile) return;

    setIsProcessing(true);
    setProgress(0);

    const updatedBookings = [...bookings];
    let successCount = 0;

    for (let i = 0; i < updatedBookings.length; i++) {
      try {
        // Simulate booking creation - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real implementation, call createAgentBooking here
        updatedBookings[i].status = 'success';
        successCount++;
      } catch (error: any) {
        updatedBookings[i].status = 'error';
        updatedBookings[i].error = error.message;
      }

      setProgress(((i + 1) / updatedBookings.length) * 100);
      setBookings([...updatedBookings]);
    }

    setIsProcessing(false);
    toast.success(`Processed ${successCount} of ${bookings.length} bookings successfully`);
  };

  const totalCommission = bookings
    .filter(b => b.status === 'success')
    .reduce((sum) => sum + 50, 0) * (merchantProfile?.commission_rate || 10) / 100;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Bulk Booking</h1>
        <p className="text-muted-foreground mt-1">
          Upload a CSV file to book multiple tickets at once
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Bookings</CardTitle>
          <CardDescription>
            Download the template, fill it out, and upload to process bulk bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </div>
          </div>

          {file && (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                Loaded {bookings.length} bookings from {file.name}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {bookings.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Preview & Process</CardTitle>
              <CardDescription>
                Review bookings before processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing bookings...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.row}>
                        <TableCell>{booking.row}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.client_name}</div>
                            <div className="text-sm text-muted-foreground">{booking.client_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{booking.booking_type}</TableCell>
                        <TableCell>{booking.item_name}</TableCell>
                        <TableCell>{booking.travel_date}</TableCell>
                        <TableCell>
                          {booking.status === 'pending' && (
                            <Badge variant="outline">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {booking.status === 'success' && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Success
                            </Badge>
                          )}
                          {booking.status === 'error' && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm">
                  <div className="font-medium">Estimated Commission</div>
                  <div className="text-2xl font-bold text-primary">
                    R {totalCommission.toFixed(2)}
                  </div>
                </div>
                <Button
                  onClick={processBookings}
                  disabled={isProcessing || bookings.every(b => b.status !== 'pending')}
                  size="lg"
                >
                  {isProcessing ? "Processing..." : "Process All Bookings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
