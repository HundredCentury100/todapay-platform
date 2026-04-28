import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import VenueCategoryForm from "@/components/booking/VenueCategoryForm";
import BookingSpecialtyAddOns from "@/components/booking/BookingSpecialtyAddOns";
import { format } from "date-fns";
import { Loader2, Calendar } from "lucide-react";
import { VenueWithMerchant, createVenueBooking } from "@/services/venueService";
import { VENUE_EVENT_TYPES, CateringOption, VenueEquipment } from "@/types/venue";
import VenueGuestCounter from "@/components/venue/VenueGuestCounter";
import VenuePackageBuilder from "@/components/venue/VenuePackageBuilder";
import VenueTrustBanner from "@/components/venue/VenueTrustBanner";

interface VenueBookingFormProps {
  venue: VenueWithMerchant;
  selectedDate?: Date;
  onSuccess?: () => void;
}

const VenueBookingForm = ({ venue, selectedDate, onSuccess }: VenueBookingFormProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_type: "",
    event_name: "",
    start_time: "09:00",
    end_time: "17:00",
    expected_guests: 50,
    setup_requirements: "",
    passenger_name: "",
    passenger_email: "",
    passenger_phone: "",
  });
  const [selectedCatering, setSelectedCatering] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [venueCategoryData, setVenueCategoryData] = useState<Record<string, any>>({});
  const [specialtyAddOns, setSpecialtyAddOns] = useState<Record<string, any>>({});

  const calculatePrice = () => {
    if (!selectedDate) return 0;

    const startHour = parseInt(formData.start_time.split(':')[0]);
    const endHour = parseInt(formData.end_time.split(':')[0]);
    const hours = endHour - startHour;

    let basePrice = 0;
    if (hours >= 8 && venue.full_day_rate) {
      basePrice = venue.full_day_rate;
    } else if (hours >= 4 && venue.half_day_rate) {
      basePrice = venue.half_day_rate;
    } else if (venue.hourly_rate) {
      basePrice = venue.hourly_rate * hours;
    }

    const cateringCost = selectedCatering.reduce((total, catId) => {
      const catering = venue.catering_options.find((c: CateringOption) => c.id === catId);
      return catering ? total + (catering.price_per_person * formData.expected_guests) : total;
    }, 0);

    const equipmentCost = selectedEquipment.reduce((total, eqId) => {
      const equipment = venue.equipment_available.find((e: VenueEquipment) => e.id === eqId);
      return equipment ? total + equipment.price : total;
    }, 0);

    return basePrice + cateringCost + equipmentCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!formData.event_type) {
      toast.error("Please select an event type");
      return;
    }

    if (!formData.passenger_name || !formData.passenger_email || !formData.passenger_phone) {
      toast.error("Please fill in all contact details");
      return;
    }

    setLoading(true);

    try {
      const startDatetime = `${format(selectedDate, 'yyyy-MM-dd')}T${formData.start_time}:00`;
      const endDatetime = `${format(selectedDate, 'yyyy-MM-dd')}T${formData.end_time}:00`;
      const totalPrice = calculatePrice();

      const cateringSelection = selectedCatering.map(catId => {
        const catering = venue.catering_options.find((c: CateringOption) => c.id === catId);
        return catering ? {
          catering_option_id: catId,
          name: catering.name,
          quantity: formData.expected_guests,
          price_per_person: catering.price_per_person,
        } : null;
      }).filter(Boolean);

      const equipmentSelection = selectedEquipment.map(eqId => {
        const equipment = venue.equipment_available.find((e: VenueEquipment) => e.id === eqId);
        return equipment ? {
          equipment_id: eqId,
          name: equipment.name,
          quantity: 1,
          price: equipment.price,
        } : null;
      }).filter(Boolean);

      const { booking } = await createVenueBooking({
        venue_id: venue.id,
        event_type: formData.event_type,
        event_name: formData.event_name,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        expected_guests: formData.expected_guests,
        setup_requirements: formData.setup_requirements,
        catering_selection: cateringSelection,
        equipment_selection: equipmentSelection,
        passenger_name: formData.passenger_name,
        passenger_email: formData.passenger_email,
        passenger_phone: formData.passenger_phone,
        total_price: totalPrice,
        base_price: totalPrice,
      });

      toast.success("Booking created successfully!");
      
      navigate('/booking/confirm', {
        state: {
          type: 'venue',
          itemId: venue.id,
          itemName: venue.name,
          totalPrice,
          basePrice: totalPrice,
          passengerName: formData.passenger_name,
          passengerEmail: formData.passenger_email,
          passengerPhone: formData.passenger_phone,
          startDatetime,
          endDatetime,
          eventDate: format(selectedDate, 'yyyy-MM-dd'),
          eventTime: formData.start_time,
          eventType: formData.event_type,
          venue: venue.address,
          to: venue.city,
          numAttendees: formData.expected_guests,
          preConfirmed: true,
          bookingId: booking?.id,
          bookingReference: booking?.booking_reference,
        }
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const maxCapacity = Math.max(
    venue.capacity_standing || 0,
    venue.capacity_seated || 0,
    venue.capacity_theater || 0,
    venue.capacity_banquet || 0,
    1000
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Book This Venue</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Details */}
          <div className="space-y-3">
            <div>
              <Label>Event Type *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
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
              <Label>Event Name</Label>
              <Input
                placeholder="e.g., John's Wedding"
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
              />
            </div>

            {selectedDate && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            {/* Guest Counter Stepper */}
            <VenueGuestCounter
              value={formData.expected_guests}
              onChange={(v) => setFormData({ ...formData, expected_guests: v })}
              max={maxCapacity}
            />

            <div>
              <Label>Setup Requirements</Label>
              <Textarea
                placeholder="Describe any specific setup needs..."
                value={formData.setup_requirements}
                onChange={(e) => setFormData({ ...formData, setup_requirements: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Package Builder */}
          <VenuePackageBuilder
            cateringOptions={venue.catering_options}
            equipmentAvailable={venue.equipment_available}
            selectedCatering={selectedCatering}
            selectedEquipment={selectedEquipment}
            onCateringChange={setSelectedCatering}
            onEquipmentChange={setSelectedEquipment}
            guestCount={formData.expected_guests}
          />

          {/* Contact Details */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <h4 className="font-medium">Contact Details</h4>
            <div>
              <Label>Full Name *</Label>
              <Input
                placeholder="Your full name"
                value={formData.passenger_name}
                onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.passenger_email}
                onChange={(e) => setFormData({ ...formData, passenger_email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                type="tel"
                placeholder="+263 XX XXX XXXX"
                value={formData.passenger_phone}
                onChange={(e) => setFormData({ ...formData, passenger_phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Trust Banner */}
          <VenueTrustBanner />

          {/* Price Summary */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total Price</span>
              <span className="text-primary">${calculatePrice().toLocaleString()}</span>
            </div>
          </div>

          <VenueCategoryForm
            eventType={formData.event_type}
            data={venueCategoryData}
            onChange={setVenueCategoryData}
          />
          <BookingSpecialtyAddOns
            vertical="venue"
            data={specialtyAddOns}
            onChange={setSpecialtyAddOns}
          />

          <Button type="submit" className="w-full rounded-full press-effect" size="lg" disabled={loading || !selectedDate}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Request Booking"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VenueBookingForm;
