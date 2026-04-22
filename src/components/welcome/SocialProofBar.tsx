import { motion } from "framer-motion";
import { Users, Star, MapPin } from "lucide-react";

const stats = [
  { icon: Users, value: "500K+", label: "Travelers" },
  { icon: Star, value: "4.8", label: "Rating" },
  { icon: MapPin, value: "50+", label: "Cities" },
];

export const SocialProofBar = () => {
  return (
    <motion.div 
      className="flex justify-center gap-8 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3 + index * 0.1 }}
        >
          <stat.icon className="w-4 h-4 text-primary" />
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-foreground">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
