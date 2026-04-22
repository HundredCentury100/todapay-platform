import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Percent } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface GroupBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketQuantity: number;
  onGroupBookingConfirm: (data: any) => void;
}

const GroupBookingDialog = ({
  open,
  onOpenChange,
  ticketQuantity,
  onGroupBookingConfirm,
}: GroupBookingDialogProps) => {
  const { convertPrice } = useCurrency();
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [coordinatorPhone, setCoordinatorPhone] = useState("");
  const [groupName, setGroupName] = useState("");
  const [splitPayment, setSplitPayment] = useState(false);
  const [bookingType, setBookingType] = useState<"general" | "class" | "grade" | "school">("general");
  const [className, setClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const getDiscountPercentage = (quantity: number) => {
    if (quantity >= 20) return 20;
    if (quantity >= 10) return 15;
    if (quantity >= 5) return 10;
    return 0;
  };

  const getEnhancedDiscountPercentage = (quantity: number, type: string): number => {
    if (type === "school") return 30;
    if (type === "grade") return 25;
    if (type === "class") return 20;
    return getDiscountPercentage(quantity);
  };

  const discount = getEnhancedDiscountPercentage(ticketQuantity, bookingType);

  const handleSubmit = () => {
    if (!coordinatorName || !coordinatorEmail || !coordinatorPhone) {
      return;
    }

    if (bookingType === "class" && !className) {
      return;
    }

    if (bookingType === "grade" && !gradeLevel) {
      return;
    }

    if (bookingType === "school" && !schoolName) {
      return;
    }

    onGroupBookingConfirm({
      groupName: bookingType === "class" ? className : 
                 bookingType === "grade" ? `Grade ${gradeLevel}` :
                 bookingType === "school" ? schoolName : groupName,
      coordinatorName,
      coordinatorEmail,
      coordinatorPhone,
      splitPayment,
      discountPercentage: getEnhancedDiscountPercentage(ticketQuantity, bookingType),
      bookingType,
      className: bookingType === "class" ? className : undefined,
      gradeLevel: bookingType === "grade" ? gradeLevel : undefined,
      schoolName: bookingType === "school" ? schoolName : undefined
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {discount > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {bookingType === "school" ? "School" : 
                   bookingType === "grade" ? "Grade" :
                   bookingType === "class" ? "Class" : "Group"} Discount Applied
                </span>
              </div>
              <Badge className="bg-primary text-primary-foreground">{discount}% OFF</Badge>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="booking-type">Booking Type</Label>
            <Select value={bookingType} onValueChange={(value: any) => setBookingType(value)}>
              <SelectTrigger id="booking-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Group</SelectItem>
                <SelectItem value="class">Class Booking (20% discount)</SelectItem>
                <SelectItem value="grade">Grade-Level Booking (25% discount)</SelectItem>
                <SelectItem value="school">Whole School Booking (30% discount)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bookingType === "general" && (
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name (Optional)</Label>
              <Input
                id="group-name"
                placeholder="e.g., Company Outing, Birthday Party..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          {bookingType === "class" && (
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name *</Label>
              <Input
                id="class-name"
                placeholder="e.g., 5B, Year 10 Math"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>
          )}

          {bookingType === "grade" && (
            <div className="space-y-2">
              <Label htmlFor="grade-level">Grade Level *</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger id="grade-level">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kindergarten">Kindergarten</SelectItem>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                  <SelectItem value="6">Grade 6</SelectItem>
                  <SelectItem value="7">Grade 7</SelectItem>
                  <SelectItem value="8">Year 8</SelectItem>
                  <SelectItem value="9">Year 9</SelectItem>
                  <SelectItem value="10">Year 10</SelectItem>
                  <SelectItem value="11">Year 11</SelectItem>
                  <SelectItem value="12">Year 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {bookingType === "school" && (
            <div className="space-y-2">
              <Label htmlFor="school-name">School Name *</Label>
              <Input
                id="school-name"
                placeholder="e.g., Springfield Primary School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="coordinator-name">Coordinator Name *</Label>
            <Input
              id="coordinator-name"
              placeholder="John Doe"
              value={coordinatorName}
              onChange={(e) => setCoordinatorName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinator-email">Coordinator Email *</Label>
            <Input
              id="coordinator-email"
              type="email"
              placeholder="john@example.com"
              value={coordinatorEmail}
              onChange={(e) => setCoordinatorEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinator-phone">Coordinator Phone *</Label>
            <Input
              id="coordinator-phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={coordinatorPhone}
              onChange={(e) => setCoordinatorPhone(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="split-payment"
              checked={splitPayment}
              onCheckedChange={(checked) => setSplitPayment(checked as boolean)}
            />
            <label htmlFor="split-payment" className="text-sm">
              Enable split payment among group members
            </label>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              As the group coordinator, you'll receive a unique link to share with your group members
              for payment collection and ticket distribution.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!coordinatorName || !coordinatorEmail || !coordinatorPhone}
              className="w-full"
            >
              Confirm Group Booking
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupBookingDialog;
