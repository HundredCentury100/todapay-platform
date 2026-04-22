import { motion } from "framer-motion";
import { Bus, Plane, Hotel, Car, Calendar, Sparkles } from "lucide-react";

const services = [
  { icon: Bus, label: "Buses", gradient: "from-sky-500 to-blue-600" },
  { icon: Plane, label: "Flights", gradient: "from-violet-500 to-purple-600" },
  { icon: Hotel, label: "Stays", gradient: "from-amber-500 to-orange-600" },
  { icon: Car, label: "Rides", gradient: "from-emerald-500 to-green-600" },
  { icon: Calendar, label: "Events", gradient: "from-rose-500 to-pink-600" },
  { icon: Sparkles, label: "More", gradient: "from-primary to-primary-dark" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.6,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.5, y: 20 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

export const ServicePillRow = () => {
  return (
    <motion.div 
      className="flex justify-center gap-3 flex-wrap px-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {services.map((service) => (
        <motion.div
          key={service.label}
          variants={item}
          className="flex flex-col items-center gap-2"
        >
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200`}>
            <service.icon className="w-6 h-6 text-white drop-shadow-sm" strokeWidth={2.2} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{service.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};
