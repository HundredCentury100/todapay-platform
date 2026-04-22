import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Smartphone, Globe2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const PayPaymentMethods = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Payment Methods</h3>
        <Link to="/payment-methods" className="text-xs text-primary font-medium">Manage</Link>
      </div>
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardContent className="p-0 divide-y divide-border">
          <Link to="/pay/card" className="flex items-center gap-3 w-full p-3.5 hover:bg-muted/50 transition-colors tap-target">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Pay with Card</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard P2P</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/payment-methods" className="flex items-center gap-3 w-full p-3.5 hover:bg-muted/50 transition-colors tap-target">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Mobile Money</p>
              <p className="text-xs text-muted-foreground">Suvat Pay, O'mari, InnBucks</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/pay/remittance" className="flex items-center gap-3 w-full p-3.5 hover:bg-muted/50 transition-colors tap-target">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Globe2 className="h-5 w-5 text-sky-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">International Transfer</p>
              <p className="text-xs text-muted-foreground">Send & receive across borders</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};
