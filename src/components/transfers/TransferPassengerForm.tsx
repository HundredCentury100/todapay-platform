import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, ArrowRight } from "lucide-react";
import { PassengerData } from "@/pages/TransferBooking";

interface TransferPassengerFormProps {
  data: PassengerData;
  onChange: (data: PassengerData) => void;
  onContinue: () => void;
}

export const TransferPassengerForm = ({ data, onChange, onContinue }: TransferPassengerFormProps) => {
  const isValid = data.name && data.email && data.phone;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-6 space-y-5">
          <h3 className="font-semibold text-lg">Passenger Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="pax-name" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Full Name *
            </Label>
            <Input
              id="pax-name"
              placeholder="John Doe"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pax-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email *
            </Label>
            <Input
              id="pax-email"
              type="email"
              placeholder="john@example.com"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pax-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Phone Number *
            </Label>
            <Input
              id="pax-phone"
              placeholder="+263 77 123 4567"
              value={data.phone}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pax-special">Special Requirements</Label>
            <Textarea
              id="pax-special"
              placeholder="Child seat needed, wheelchair access, etc."
              value={data.specialRequirements || ''}
              onChange={(e) => onChange({ ...data, specialRequirements: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full h-14 text-lg font-semibold"
        onClick={onContinue}
        disabled={!isValid}
      >
        Continue to Review
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
};
