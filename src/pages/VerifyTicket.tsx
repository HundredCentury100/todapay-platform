import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield } from "lucide-react";
import { validateTicket } from "@/services/ticketSharingService";
import Navigation from "@/components/Navigation";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";

const VerifyTicket = () => {
  const [bookingReference, setBookingReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async () => {
    if (!bookingReference || !email) return;

    setLoading(true);
    setResult(null);

    try {
      const validation = await validateTicket(bookingReference, email);
      setResult(validation);
    } catch (error) {
      setResult({ valid: false, error: "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <BackButton fallbackPath="/" />
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Verify Ticket</h1>
            </div>
            <p className="text-muted-foreground">
              Enter your booking details to verify ticket authenticity
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Verification</CardTitle>
              <CardDescription>
                Verify that your ticket is genuine and valid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Booking Reference</Label>
                <Input
                  id="reference"
                  placeholder="e.g., ABC123"
                  value={bookingReference}
                  onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleVerify}
                disabled={loading || !bookingReference || !email}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify Ticket"}
              </Button>

              {result && (
                <Alert variant={result.valid ? "default" : "destructive"}>
                  <div className="flex items-start gap-3">
                    {result.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1 space-y-2">
                      <AlertDescription>
                        {result.valid ? (
                          <>
                            <div className="font-semibold text-green-600 mb-2">
                              ✓ Valid Ticket Confirmed
                            </div>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="text-muted-foreground">Event:</span>{" "}
                                <span className="font-medium">{result.booking.item_name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date:</span>{" "}
                                <span className="font-medium">
                                  {new Date(result.booking.event_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>{" "}
                                <Badge variant={result.checkedIn ? "default" : "secondary"}>
                                  {result.checkedIn ? "Checked In" : result.status}
                                </Badge>
                              </div>
                              {result.booking.selected_seats && (
                                <div>
                                  <span className="text-muted-foreground">Seats:</span>{" "}
                                  <span className="font-medium">
                                    {result.booking.selected_seats.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="font-semibold">
                            {result.error || "Invalid ticket information"}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>Security Note:</strong> This verification tool checks ticket authenticity
              but does not grant access. Always present your ticket at the venue for official
              validation.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyTicket;
