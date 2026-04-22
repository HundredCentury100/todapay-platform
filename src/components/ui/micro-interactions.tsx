import { useState, useEffect, useRef, ReactNode } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

/**
 * BounceTap — wraps children with a scale-down on press + spring bounce release
 */
export const BounceTap = ({
  children,
  className,
  scale = 0.95,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) => (
  <motion.div
    whileTap={{ scale }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * RippleButton — Button with a material-design ripple on click
 */
export const RippleButton = ({
  children,
  className,
  onClick,
  ...props
}: ButtonProps) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const nextId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = nextId.current++;
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick?.(e);
  };

  return (
    <Button
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-primary-foreground/30 animate-[ripple_0.6s_ease-out]"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </Button>
  );
};

/**
 * AnimatedCounter — number that counts up/down with spring physics
 */
export const AnimatedCounter = ({
  value,
  formatter,
  className,
  duration = 1.2,
}: {
  value: number;
  formatter?: (v: number) => string;
  className?: string;
  duration?: number;
}) => {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (latest) =>
    formatter ? formatter(Math.round(latest)) : Math.round(latest).toLocaleString()
  );
  const [displayValue, setDisplayValue] = useState(formatter ? formatter(0) : "0");

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on("change", (v) => setDisplayValue(v));
    return unsubscribe;
  }, [value, spring, display]);

  return <span className={className}>{displayValue}</span>;
};

/**
 * PulseGlow — pulsing glow ring around children
 */
export const PulseGlow = ({
  children,
  className,
  color = "primary",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) => (
  <div className={cn("relative", className)}>
    <div className="absolute inset-0 rounded-full bg-primary/20 animate-[pulseGlow_2s_ease-in-out_infinite]" />
    {children}
  </div>
);

/**
 * SuccessConfetti — lightweight CSS confetti burst
 */
export const SuccessConfetti = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              backgroundColor: [
                "hsl(var(--primary))",
                "hsl(45 100% 60%)",
                "hsl(150 80% 50%)",
                "hsl(280 80% 60%)",
                "hsl(15 90% 55%)",
                "hsl(200 90% 55%)",
              ][i % 6],
            }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0.5],
              x: Math.cos((i * 30 * Math.PI) / 180) * (60 + Math.random() * 40),
              y: Math.sin((i * 30 * Math.PI) / 180) * (60 + Math.random() * 40) - 20,
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
      </div>
    )}
  </AnimatePresence>
);

/**
 * StaggerContainer — children enter with stagger delay
 */
export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.05,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: staggerDelay } },
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    }}
  >
    {children}
  </motion.div>
);
