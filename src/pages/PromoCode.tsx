import { useState } from "react";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Gift, CheckCircle, Loader2, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { claimPromoAsVoucher } from "@/services/voucherService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const PromoCode = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState<{ code: string; discount_type: string; discount_value: number; description?: string } | null>(null);
  const { user } = useAuth();

  const handleApplyCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    if (!user) {
      toast.error("Please sign in to use promo codes");
      return;
    }

    setIsLoading(true);
    try {
      const result = await claimPromoAsVoucher(code);
      if (result.success && result.voucher) {
        setClaimedVoucher({
          code: result.voucher.code,
          discount_type: result.voucher.discount_type,
          discount_value: result.voucher.discount_value,
          description: result.voucher.description || undefined,
        });
        toast.success("Promo code claimed! A voucher has been added to your account.");
        setCode("");
      } else {
        toast.error(result.error || "Invalid promo code");
      }
    } catch {
      toast.error("Failed to validate promo code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/profile" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">Promo Code</h1>
              <p className="text-xs text-muted-foreground">Enter a code to unlock rewards</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6">
          {/* Success State */}
          {claimedVoucher && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="p-6 rounded-2xl border-0 shadow-md bg-primary/5 border-primary/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">Voucher Claimed!</h2>
                <p className="text-center text-muted-foreground text-sm mb-3">
                  {claimedVoucher.description || 'Your discount is ready to use'}
                </p>
                <div className="bg-background rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your voucher code</p>
                  <p className="font-mono font-bold text-primary text-lg">{claimedVoucher.code}</p>
                  <p className="text-sm font-medium mt-1">
                    {claimedVoucher.discount_type === 'percentage' 
                      ? `${claimedVoucher.discount_value}% OFF` 
                      : `$${claimedVoucher.discount_value} OFF`}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setClaimedVoucher(null)}>
                    Add Another
                  </Button>
                  <Button asChild className="flex-1 rounded-xl">
                    <Link to="/vouchers">
                      <Ticket className="w-4 h-4 mr-1" />
                      My Vouchers
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Promo Input */}
          {!claimedVoucher && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 rounded-2xl border-0 shadow-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Tag className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-4">Have a Promo Code?</h2>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter code (e.g., WELCOME20)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="text-center text-lg tracking-wider h-12 rounded-xl"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
                  />
                  <Button
                    className="w-full h-12 rounded-xl"
                    onClick={handleApplyCode}
                    disabled={isLoading || !code.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      "Claim Code"
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* How it works */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-5 rounded-2xl border-0 shadow-md">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                How it works
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Enter a valid promo code above
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  A voucher will be saved to your account
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Apply the voucher at checkout for a discount
                </li>
              </ul>
            </Card>
          </motion.div>
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default PromoCode;
