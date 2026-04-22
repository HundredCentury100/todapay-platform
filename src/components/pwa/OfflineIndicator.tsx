import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-0 left-0 right-0 z-[100] safe-area-pt"
        >
          <div className="bg-destructive text-destructive-foreground px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">You're offline</span>
            </div>
          </div>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-0 left-0 right-0 z-[100] safe-area-pt"
        >
          <div className="bg-emerald-500 text-white px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Back online!</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
