import { useState } from "react";
import { Plus, X, CreditCard, Send, Users, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Action {
  icon: typeof Plus;
  label: string;
  to: string;
  color: string;
}

const actions: Action[] = [
  { icon: CreditCard, label: "Top up", to: "#topup", color: "bg-emerald-500" },
  { icon: ArrowLeftRight, label: "Exchange", to: "/wallet/exchange", color: "bg-blue-500" },
  { icon: Send, label: "Send", to: "/pay/send", color: "bg-purple-500" },
  { icon: Users, label: "Split bill", to: "/wallet/split", color: "bg-pink-500" },
];

interface FloatingActionMenuProps {
  onTopUp?: () => void;
}

export function FloatingActionMenu({ onTopUp }: FloatingActionMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (a: Action) => {
    setOpen(false);
    if (a.to === "#topup") onTopUp?.();
    else navigate(a.to);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
          >
            {actions.map((a, idx) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleAction(a)}
                className="flex items-center gap-3"
              >
                <span className="revolut-pill px-3 py-1.5 text-xs font-medium whitespace-nowrap">
                  {a.label}
                </span>
                <span className={`h-12 w-12 rounded-full ${a.color} text-white flex items-center justify-center shadow-lg`}>
                  <a.icon className="h-5 w-5" />
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-[hsl(var(--revolut-accent))] text-white flex items-center justify-center shadow-2xl"
        aria-label={open ? "Close menu" : "Open quick actions"}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
