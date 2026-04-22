import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTripCart } from '@/contexts/TripCartContext';
import { motion, AnimatePresence } from 'framer-motion';

export function TripCartButton() {
  const { items, getItemCount, getFinalTotal, isCartOpen, setCartOpen } = useTripCart();

  if (items.length === 0 || isCartOpen) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCartOpen(true)}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="font-semibold">{getItemCount()}</span>
        <Badge variant="secondary" className="ml-1 text-xs">
          ${getFinalTotal().toLocaleString()}
        </Badge>
      </motion.button>
    </AnimatePresence>
  );
}
