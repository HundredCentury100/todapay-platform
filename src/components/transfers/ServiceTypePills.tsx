import { motion } from "framer-motion";
import { SERVICE_TYPES, TransferServiceType } from "@/types/transfer";
import { cn } from "@/lib/utils";

interface ServiceTypePillsProps {
  selectedType: TransferServiceType;
  onSelectType: (type: TransferServiceType) => void;
  showAirportOnly?: boolean;
}

export const ServiceTypePills = ({
  selectedType,
  onSelectType,
  showAirportOnly = false,
}: ServiceTypePillsProps) => {
  const filteredTypes = showAirportOnly 
    ? SERVICE_TYPES.filter(t => t.isAirport)
    : SERVICE_TYPES;

  return (
    <div className="flex flex-wrap gap-2">
      {filteredTypes.map((type, index) => {
        const isSelected = selectedType === type.id;
        
        return (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelectType(type.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200",
              isSelected
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <span>{type.icon}</span>
            <span>{type.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
