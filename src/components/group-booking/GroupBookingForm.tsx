import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Plus, Trash2, Percent, 
  Loader2, UserPlus, Mail, Phone 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Passenger {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface GroupBookingFormProps {
  ticketPrice: number;
  maxTickets?: number;
  onSubmit: (passengers: Passenger[], organizerInfo: OrganizerInfo, discount: number) => void;
  isSubmitting?: boolean;
}

interface OrganizerInfo {
  name: string;
  email: string;
  phone: string;
}

const GROUP_DISCOUNTS = [
  { min: 5, max: 9, discount: 5 },
  { min: 10, max: 19, discount: 10 },
  { min: 20, max: 49, discount: 15 },
  { min: 50, max: Infinity, discount: 20 }
];

export function GroupBookingForm({
  ticketPrice,
  maxTickets = 50,
  onSubmit,
  isSubmitting = false
}: GroupBookingFormProps) {
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: '1', name: '', email: '', phone: '' }
  ]);
  const [organizer, setOrganizer] = useState<OrganizerInfo>({
    name: '',
    email: '',
    phone: ''
  });

  const addPassenger = () => {
    if (passengers.length >= maxTickets) {
      toast.error(`Maximum ${maxTickets} tickets allowed`);
      return;
    }
    setPassengers(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', email: '', phone: '' }
    ]);
  };

  const removePassenger = (id: string) => {
    if (passengers.length === 1) return;
    setPassengers(prev => prev.filter(p => p.id !== id));
  };

  const updatePassenger = (id: string, field: keyof Passenger, value: string) => {
    setPassengers(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const getGroupDiscount = () => {
    const count = passengers.length;
    const tier = GROUP_DISCOUNTS.find(t => count >= t.min && count <= t.max);
    return tier?.discount || 0;
  };

  const calculateTotal = () => {
    const subtotal = passengers.length * ticketPrice;
    const discount = (subtotal * getGroupDiscount()) / 100;
    return subtotal - discount;
  };

  const handleSubmit = () => {
    // Validate organizer
    if (!organizer.name || !organizer.email || !organizer.phone) {
      toast.error("Please fill in organizer details");
      return;
    }

    // Validate at least first passenger
    const validPassengers = passengers.filter(p => p.name.trim());
    if (validPassengers.length === 0) {
      toast.error("Please add at least one passenger");
      return;
    }

    onSubmit(validPassengers, organizer, getGroupDiscount());
  };

  const discount = getGroupDiscount();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Group Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Discount Banner */}
        {discount > 0 && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">
                {discount}% Group Discount Applied!
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Groups of {passengers.length}+ get special pricing
            </p>
          </div>
        )}

        {/* Discount Tiers */}
        <div className="flex flex-wrap gap-2">
          {GROUP_DISCOUNTS.slice(0, 3).map((tier) => (
            <Badge 
              key={tier.min}
              variant={passengers.length >= tier.min ? "default" : "outline"}
              className={cn(
                passengers.length >= tier.min && "bg-green-600"
              )}
            >
              {tier.min}+ tickets = {tier.discount}% off
            </Badge>
          ))}
        </div>

        <Separator />

        {/* Organizer Info */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Organizer Details
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Full name"
                value={organizer.name}
                onChange={(e) => setOrganizer(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Email"
                value={organizer.email}
                onChange={(e) => setOrganizer(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="Phone"
                value={organizer.phone}
                onChange={(e) => setOrganizer(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Passengers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Passengers ({passengers.length})
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPassenger}
              disabled={passengers.length >= maxTickets}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Passenger
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {passengers.map((passenger, index) => (
              <div 
                key={passenger.id}
                className="p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Passenger {index + 1}</span>
                  {passengers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removePassenger(passenger.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Full name"
                    value={passenger.name}
                    onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)}
                  />
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email (optional)"
                      value={passenger.email}
                      onChange={(e) => updatePassenger(passenger.id, 'email', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={passenger.phone}
                      onChange={(e) => updatePassenger(passenger.id, 'phone', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {passengers.length} × R{ticketPrice.toFixed(2)}
            </span>
            <span>R{(passengers.length * ticketPrice).toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Group discount ({discount}%)</span>
              <span>-R{((passengers.length * ticketPrice * discount) / 100).toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>R{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Users className="h-4 w-4 mr-2" />
          )}
          Book for {passengers.length} {passengers.length === 1 ? 'Person' : 'People'}
        </Button>
      </CardContent>
    </Card>
  );
}
