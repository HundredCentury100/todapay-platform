import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CarTaxiFront, Bus, Calendar, Building2, Briefcase, MapPinned, Compass, Car, LucideIcon
} from "lucide-react";

interface ServiceItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  bgColor: string;
}

const services: ServiceItem[] = [
  { id: "buses", label: "Buses", icon: Bus, path: "/buses", bgColor: "from-teal-500 to-teal-600" },
  { id: "events", label: "Events", icon: Calendar, path: "/events", bgColor: "from-pink-500 to-pink-600" },
  { id: "experiences", label: "Experiences", icon: Compass, path: "/experiences", bgColor: "from-amber-500 to-amber-600" },
  { id: "rides", label: "Rides", icon: Car, path: "/ride-booking", bgColor: "from-green-500 to-green-600" },
  { id: "stays", label: "Stays", icon: Building2, path: "/stays", bgColor: "from-orange-500 to-orange-600" },
  { id: "transfers", label: "Transfers", icon: CarTaxiFront, path: "/transfers", bgColor: "from-sky-500 to-sky-600" },
  { id: "venues", label: "Venues", icon: MapPinned, path: "/venues", bgColor: "from-emerald-500 to-emerald-600" },
  { id: "workspaces", label: "Workspaces", icon: Briefcase, path: "/workspaces", bgColor: "from-violet-500 to-violet-600" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 22 },
  },
};

export const ServiceGrid = () => {
  return (
    <div className="px-5">
      <motion.div 
        className="grid grid-cols-4 gap-x-2 gap-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {services.map((service) => (
          <motion.div key={service.id} variants={itemVariants}>
            <Link
              to={service.path}
              className="group flex flex-col items-center gap-2.5 py-1 press-effect tap-target"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.bgColor} flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 group-hover:shadow-xl group-active:scale-95 transition-all duration-200`}>
                <service.icon className="h-6 w-6 text-white drop-shadow-sm" strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-semibold text-foreground/80 text-center leading-tight group-hover:text-foreground transition-colors">
                {service.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
