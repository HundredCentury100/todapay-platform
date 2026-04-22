import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface FadeTransitionProps {
  isLoading: boolean;
  children: ReactNode;
  className?: string;
}

export const FadeTransition = ({ isLoading, children, className }: FadeTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      {!isLoading && (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
