import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, Hash, User, Mail, Phone, MapPin, Calendar, Clock,
  DollarSign, CreditCard, Ticket, Bus, CalendarDays, Building2,
  Hotel, Plane, Laptop, Car, Truck, Compass, FileText, Shield,
} from "lucide-react";

const verticalIcons: Record<string, any> = {
  bus: Bus, event: CalendarDays, venue: Building2, stay: Hotel,
  flight: Plane, workspace: Laptop, car_rental: Car, transfer: Truck, experience: Compass,
};

const AdminBookingDetail = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [booking, setBooking] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId!)
        .single();
      if (error) throw error;
      setBooking(data);

      const { data: txn } = await supabase
        .from("transactions")
        .select("*")
        .eq("booking_id", bookingId!)
        .maybeSingle();
      setTransaction(txn);
    } catch (error: any) {
      toast.error("Failed to load booking details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdminUser) return <Navigate to="/merchant/admin/auth" replace />;
  if (!booking) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Booking not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const VerticalIcon = verticalIcons[booking.vertical || booking.booking_type] || FileText;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <VerticalIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{booking.item_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="font-mono text-xs">
              <Hash className="h-3 w-3 mr-1" />{booking.booking_reference}
            </Badge>
            <Badge variant="outline" className="capitalize text-xs">
              {booking.vertical || booking.booking_type}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booking</span>
              <Badge variant={booking.status === "confirmed" ? "default" : booking.status === "cancelled" ? "destructive" : "secondary"}>
                {booking.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment</span>
              <Badge variant={booking.payment_status === "paid" ? "default" : "secondary"}>
                {booking.payment_status}
              </Badge>
            </div>
            {booking.checked_in && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-in</span>
                <Badge variant="default">Checked In</Badge>
              </div>
            )}
            {booking.refund_status && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Refund</span>
                <Badge variant="secondary">{booking.refund_status}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={User} label="Name" value={booking.passenger_name} />
            <InfoRow icon={Mail} label="Email" value={booking.passenger_email} />
            <InfoRow icon={Phone} label="Phone" value={booking.passenger_phone} />
            <InfoRow icon={Shield} label="Passport" value={booking.passport_number} />
            <InfoRow icon={Phone} label="WhatsApp" value={booking.whatsapp_number} />
            <InfoRow icon={User} label="Next of Kin" value={booking.next_of_kin_number} />
          </CardContent>
        </Card>

        {/* Trip / Event Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={MapPin} label="From" value={booking.from_location} />
            <InfoRow icon={MapPin} label="To" value={booking.to_location} />
            <InfoRow icon={MapPin} label="Final Destination" value={booking.final_destination_city} />
            <InfoRow icon={Calendar} label="Travel Date" value={booking.travel_date} />
            <InfoRow icon={Calendar} label="Event Date" value={booking.event_date} />
            <InfoRow icon={Clock} label="Event Time" value={booking.event_time} />
            <InfoRow icon={Building2} label="Venue" value={booking.event_venue} />
            <InfoRow icon={Clock} label="Departure" value={booking.departure_time} />
            <InfoRow icon={Clock} label="Arrival" value={booking.arrival_time} />
            <InfoRow icon={Bus} label="Operator" value={booking.operator} />
            <InfoRow icon={Ticket} label="Seats" value={booking.selected_seats?.join(", ")} />
            <InfoRow icon={Ticket} label="Ticket Qty" value={booking.ticket_quantity} />
            <InfoRow icon={Ticket} label="Ticket #" value={booking.ticket_number} />
            {booking.is_return_ticket && <InfoRow icon={Calendar} label="Return Date" value={booking.return_date} />}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Financial</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow icon={DollarSign} label="Base Price" value={`$${Number(booking.base_price).toFixed(2)}`} />
            <InfoRow icon={DollarSign} label="Total Price" value={`$${Number(booking.total_price).toFixed(2)}`} />
            {booking.group_discount > 0 && <InfoRow icon={DollarSign} label="Group Discount" value={`$${booking.group_discount}`} />}
            {booking.discount_code && <InfoRow icon={Ticket} label="Discount Code" value={booking.discount_code} />}
            {transaction && (
              <>
                <hr className="my-2" />
                <InfoRow icon={CreditCard} label="Payment Method" value={transaction.payment_method} />
                <InfoRow icon={Hash} label="Txn Reference" value={transaction.transaction_reference} />
                <InfoRow icon={DollarSign} label="Platform Fee" value={`$${Number(transaction.platform_fee_amount).toFixed(2)} (${transaction.platform_fee_percentage}%)`} />
                <InfoRow icon={DollarSign} label="Merchant Amount" value={`$${Number(transaction.merchant_amount).toFixed(2)}`} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Timestamps & Meta</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2">
          <InfoRow icon={Calendar} label="Created" value={booking.created_at ? format(new Date(booking.created_at), "dd MMM yyyy HH:mm") : null} />
          <InfoRow icon={Calendar} label="Updated" value={booking.updated_at ? format(new Date(booking.updated_at), "dd MMM yyyy HH:mm") : null} />
          <InfoRow icon={Hash} label="Booking ID" value={booking.id} />
          {booking.booked_by_agent_id && <InfoRow icon={User} label="Agent ID" value={booking.booked_by_agent_id} />}
          {booking.cancellation_reason && <InfoRow icon={FileText} label="Cancellation Reason" value={booking.cancellation_reason} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingDetail;
