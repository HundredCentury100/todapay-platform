import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { VENUE_EVENT_TYPES } from "@/types/venue";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Send, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";

interface VenueQuoteRequestFormProps {
  venueId: string;
  venueName: string;
}

const VenueQuoteRequestForm = ({ venueId, venueName }: VenueQuoteRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    eventType: "",
    startTime: "09:00",
    endTime: "17:00",
    expectedGuests: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !formData.eventType || !formData.customerName || !formData.customerEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("venue_quotes")
        .insert({
          venue_id: venueId,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone || null,
          event_type: formData.eventType,
          event_date: format(date, "yyyy-MM-dd"),
          start_time: formData.startTime,
          end_time: formData.endTime,
          expected_guests: formData.expectedGuests ? parseInt(formData.expectedGuests) : null,
          message: formData.message || null,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Quote request sent! The venue will respond shortly.");
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        eventType: "",
        startTime: "09:00",
        endTime: "17:00",
        expectedGuests: "",
        message: "",
      });
      setDate(undefined);
    } catch (error) {
      console.error("Error submitting quote request:", error);
      toast.error("Failed to send quote request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquareQuote className="h-5 w-5 text-primary" />
          Request a Quote
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get a personalized quote for your event at {venueName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="+27..."
              />
            </div>
          </div>

          <div>
            <Label>Event Type *</Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {VENUE_EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Event Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expectedGuests">Expected Guests</Label>
            <Input
              id="expectedGuests"
              type="number"
              value={formData.expectedGuests}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedGuests: e.target.value }))}
              placeholder="Approximate number"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="message">Additional Details</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us more about your event, special requirements, etc."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Quote Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VenueQuoteRequestForm;
