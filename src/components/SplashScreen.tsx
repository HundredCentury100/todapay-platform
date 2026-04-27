import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

const SplashScreen = ({ onComplete, minDisplayTime = 2500 }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const { user, loading } = useAuth();

  // Show skip button after 1 second
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 1000);
    return () => clearTimeout(skipTimer);
  }, []);

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleSkip = () => {
    handleComplete();
  };

  useEffect(() => {
    // Wait for auth to load before completing
    if (loading) return;
    
    const timer = setTimeout(() => {
      handleComplete();
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, loading]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 50%, hsl(221 83% 53%) 100%)"
          }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white/20"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
                  y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  y: -50,
                  transition: {
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: Math.random() * 2,
                  },
                }}
              />
            ))}
          </div>

          {/* Glowing orbs background */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary)/0.4) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(280 80% 60%/0.3) 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center text-center px-4">
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="mb-8"
            >
              <div className="relative">
                {/* Glow effect behind logo */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, white 0%, transparent 70%)",
                    filter: "blur(20px)",
                    transform: "scale(1.5)",
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Logo icon - Ticket */}
                <motion.div
                  className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/10 border border-white/30 flex items-center justify-center shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="w-16 h-16 md:w-20 md:h-20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <motion.path
                      d="M15 25 L85 25 L85 40 C80 40 75 45 75 50 C75 55 80 60 85 60 L85 75 L15 75 L15 60 C20 60 25 55 25 50 C25 45 20 40 15 40 Z"
                      fill="white"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                    <motion.line
                      x1="35" y1="35" x2="65" y2="35"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    />
                    <motion.line
                      x1="35" y1="45" x2="55" y2="45"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                    />
                    <motion.line
                      x1="35" y1="55" x2="60" y2="55"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                    />
                    <motion.circle
                      cx="70" cy="60"
                      r="8"
                      fill="hsl(var(--primary))"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.5 }}
                    />
                    <motion.path
                      d="M67 60 L69 62 L73 58"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: 1.7 }}
                    />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            {/* Brand name with stagger animation */}
            <motion.div
              className="overflow-hidden mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.h1
                className="text-5xl md:text-7xl font-bold text-white tracking-tight"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: 0.9,
                }}
              >
                Toda
                <motion.span
                  className="text-white/90"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  Pay
                </motion.span>
              </motion.h1>
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="text-lg md:text-xl text-white/80 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              Your all-in-one travel & lifestyle platform
            </motion.p>

            {/* From Toda Technologies branding */}
            <motion.a
              href="https://todatech.co.zw"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 text-sm text-white/60 hover:text-white/90 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >
              from <span className="font-semibold">Toda Technologies</span>
            </motion.a>

            {/* Loading indicator */}
            <motion.div
              className="mt-12 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-white/60"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>

            {/* Skip button */}
            <motion.button
              onClick={handleSkip}
              className="mt-6 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: showSkip ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              Skip
            </motion.button>
          </div>

          {/* Bottom wave decoration */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <svg
              viewBox="0 0 1440 120"
              className="w-full h-20 md:h-32"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
                fill="white"
                fillOpacity="0.1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
