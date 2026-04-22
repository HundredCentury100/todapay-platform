import { motion } from "framer-motion";
import { 
  Bus, Calendar, Building2, Hotel, Plane, Laptop, 
  Car, CarTaxiFront, Compass, Briefcase, Users 
} from "lucide-react";
import { MerchantRole } from "@/types/merchant";

interface BusinessTypeGridProps {
  selectedType: MerchantRole | null;
  onSelectType: (type: MerchantRole) => void;
}

const businessTypes = [
  { role: "bus_operator" as MerchantRole, title: "Bus Operator", icon: Bus },
  { role: "event_organizer" as MerchantRole, title: "Events", icon: Calendar },
  { role: "venue_owner" as MerchantRole, title: "Venues", icon: Building2 },
  { role: "property_owner" as MerchantRole, title: "Properties", icon: Hotel },
  { role: "airline_partner" as MerchantRole, title: "Airline", icon: Plane },
  { role: "workspace_provider" as MerchantRole, title: "Workspaces", icon: Laptop },
  { role: "car_rental_company" as MerchantRole, title: "Car Rental", icon: Car },
  { role: "transfer_provider" as MerchantRole, title: "Transfers", icon: CarTaxiFront },
  { role: "experience_host" as MerchantRole, title: "Experiences", icon: Compass },
  { role: "travel_agent" as MerchantRole, title: "Travel Agent", icon: Briefcase },
  { role: "booking_agent" as MerchantRole, title: "Booking Agent", icon: Users },
];

export const BusinessTypeGrid = ({ selectedType, onSelectType }: BusinessTypeGridProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">What type of business?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Select your business category
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {businessTypes.map((type, idx) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.role;
          
          return (
            <motion.button
              key={type.role}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelectType(type.role)}
              className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">
                {type.title}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessTypeGrid;
