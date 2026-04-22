import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const WelcomeHero = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      {/* Logo */}
      <motion.div 
        className="flex justify-center mb-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: 0.2, 
          type: "spring", 
          stiffness: 200, 
          damping: 15 
        }}
      >
        <BrandLogo size="lg" />
      </motion.div>
      
      {/* Headlines */}
      <motion.h1 
        className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <span className="text-foreground">Go anywhere.</span>
        <br />
        <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Do anything.
        </span>
      </motion.h1>
      
      <motion.p 
        className="text-lg text-muted-foreground max-w-xs mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Buses, flights, stays, rides, events — all in one app
      </motion.p>
    </motion.div>
  );
};
