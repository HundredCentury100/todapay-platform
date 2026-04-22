import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, Calendar, Plane, Users, Hotel, Laptop, Car, CarTaxiFront, Building2, Compass, Briefcase } from "lucide-react";
import { MerchantRole } from "@/types/merchant";

interface BusinessTypeSelectorProps {
  onSelectType: (role: MerchantRole) => void;
}

const businessTypes = [
  { role: "bus_operator" as MerchantRole, title: "Bus Operator", description: "Manage bus routes, schedules, and bookings", icon: Bus },
  { role: "event_organizer" as MerchantRole, title: "Event Organizer", description: "Create and manage events, tickets, and attendees", icon: Calendar },
  { role: "venue_owner" as MerchantRole, title: "Venue Owner", description: "Rent out venues for events and meetings", icon: Building2 },
  { role: "property_owner" as MerchantRole, title: "Property Owner", description: "Manage hotels, lodges, and accommodations", icon: Hotel },
  { role: "airline_partner" as MerchantRole, title: "Airline Partner", description: "Partner with airlines for flight bookings", icon: Plane },
  { role: "workspace_provider" as MerchantRole, title: "Workspace Provider", description: "List remote workspaces and coworking spaces", icon: Laptop },
  { role: "car_rental_company" as MerchantRole, title: "Car Rental", description: "Manage your fleet and rental bookings", icon: Car },
  { role: "transfer_provider" as MerchantRole, title: "Transfer Provider", description: "Offer airport transfers and shuttle services", icon: CarTaxiFront },
  { role: "experience_host" as MerchantRole, title: "Experience Host", description: "Host tours, activities, and local experiences", icon: Compass },
  { role: "travel_agent" as MerchantRole, title: "Travel Agent", description: "Book tickets for clients and earn commissions", icon: Briefcase },
  { role: "booking_agent" as MerchantRole, title: "Booking Agent", description: "Manage corporate and group bookings", icon: Users },
];

const BusinessTypeSelector = ({ onSelectType }: BusinessTypeSelectorProps) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to Merchant Portal</h1>
        <p className="text-muted-foreground">
          Choose your business type to get started
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {businessTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.role} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  <Icon className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-base">{type.title}</CardTitle>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => onSelectType(type.role)}
                  className="w-full"
                  size="sm"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessTypeSelector;