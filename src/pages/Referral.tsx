import { useState } from "react";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Copy, Share2, Gift, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const Referral = () => {
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const [copied, setCopied] = useState(false);
  
  // Generate a referral code based on user
  const referralCode = user?.id?.substring(0, 8).toUpperCase() || "GETAPP50";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on the app!",
          text: `Use my referral code ${referralCode} to get a discount on your first booking!`,
          url: window.location.origin,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/profile" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">Invite Friends</h1>
              <p className="text-xs text-muted-foreground">Earn rewards for referrals</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 space-y-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 rounded-2xl border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Invite & Earn</h2>
                <p className="text-white/80 text-sm mb-4">
                  Share your referral code and both you and your friend get rewards!
                </p>
                
                {/* Referral Code */}
                <div className="bg-white/20 rounded-xl p-4 mb-4">
                  <p className="text-xs text-white/70 mb-1">Your Referral Code</p>
                  <p className="text-2xl font-bold tracking-widest">{referralCode}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl h-11"
                    onClick={handleCopy}
                  >
                    {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button 
                    variant="secondary"
                    className="flex-1 bg-white text-violet-600 hover:bg-white/90 border-0 rounded-xl h-11"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5 rounded-2xl border-0 shadow-md">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                How it works
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="font-medium text-sm">Share your code</p>
                    <p className="text-xs text-muted-foreground">Send your referral code to friends</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <p className="font-medium text-sm">Friend signs up</p>
                    <p className="text-xs text-muted-foreground">They enter your code during registration</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <p className="font-medium text-sm">Both get rewarded</p>
                    <p className="text-xs text-muted-foreground">You both receive credits after their first booking</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5 rounded-2xl border-0 shadow-md">
              <h3 className="font-semibold mb-3">Your Referrals</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">Friends Invited</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-xl">
                  <p className="text-2xl font-bold text-green-500">{convertPrice(0)}</p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </MobileAppLayout>
  );
};

export default Referral;
