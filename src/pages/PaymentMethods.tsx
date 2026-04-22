import { useState, useEffect } from "react";
import MobileAppLayout from "@/components/MobileAppLayout";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Smartphone, Wallet, ChevronRight, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { savedPaymentService, SavedPaymentMethod } from "@/services/savedPaymentService";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";

const INNBUCKS_GREEN = "#00A651";

interface InquiryResult {
  accountNumber: string;
  accountName: string;
  msisdn: string;
  status: string;
  currency: string;
}

const PaymentMethods = () => {
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // InnBucks linking state
  const [linkOpen, setLinkOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<InquiryResult | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMethods = async () => {
    try {
      const data = await savedPaymentService.getSavedMethods();
      setSavedMethods(data);
    } catch {
      // User may not be logged in
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await savedPaymentService.deleteMethod(id);
      setSavedMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Payment method removed");
    } catch {
      toast.error("Failed to remove payment method");
    } finally {
      setDeletingId(null);
    }
  };

  const handleVerify = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!/^(07\d{8}|2637\d{8})$/.test(cleaned)) {
      toast.error("Enter a valid Zimbabwe phone number (e.g. 0771234567)");
      return;
    }

    const msisdn = cleaned.startsWith("0") ? `263${cleaned.slice(1)}` : cleaned;

    setVerifying(true);
    setInquiryResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("innbucks-payment", {
        body: { action: "linkedAccountInquiry", msisdn },
      });

      if (error) throw error;

      if (data?.data?.success) {
        setInquiryResult(data.data);
      } else {
        toast.error(data?.data?.message || "Account not found. Please check the number.");
      }
    } catch {
      toast.error("Failed to verify account. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveLinked = async () => {
    if (!inquiryResult) return;
    setSaving(true);
    try {
      const maskedPhone = `****${inquiryResult.msisdn.slice(-4)}`;
      await savedPaymentService.saveMethod(
        "mobile_money",
        "innbucks",
        maskedPhone,
        inquiryResult.accountName || "InnBucks Account",
        {
          accountNumber: inquiryResult.accountNumber,
          msisdn: inquiryResult.msisdn,
          currency: inquiryResult.currency,
        }
      );
      toast.success("InnBucks account linked!");
      setLinkOpen(false);
      setPhone("");
      setInquiryResult(null);
      fetchMethods();
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetDialog = () => {
    setPhone("");
    setInquiryResult(null);
    setVerifying(false);
    setSaving(false);
  };

  const getMethodIcon = (method: SavedPaymentMethod) => {
    if (method.provider === "innbucks") {
      return { icon: Smartphone, color: "text-[#00A651]", bg: "bg-[#00A651]/10" };
    }
    if (method.payment_type === "mobile_money") {
      return { icon: Smartphone, color: "text-green-500", bg: "bg-green-500/10" };
    }
    return { icon: CreditCard, color: "text-primary", bg: "bg-primary/10" };
  };

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b safe-area-pt">
          <div className="px-4 py-3 flex items-center gap-3">
            <BackButton fallbackPath="/profile" />
            <div className="flex-1">
              <h1 className="font-bold text-lg">Payment Methods</h1>
              <p className="text-xs text-muted-foreground">Manage how you pay</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 py-6 space-y-6">
          {/* Saved Methods */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Saved Methods</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : savedMethods.length === 0 ? (
              <Card className="p-6 rounded-2xl border-0 shadow-md text-center">
                <p className="text-sm text-muted-foreground">No saved payment methods yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {savedMethods.map((method, index) => {
                  const { icon: Icon, color, bg } = getMethodIcon(method);
                  return (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4 rounded-2xl border-0 shadow-md">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                              {method.display_name || method.provider || "Payment Method"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {method.provider === "innbucks" ? "InnBucks" : method.provider || method.payment_type}
                              {method.masked_reference ? ` · ${method.masked_reference}` : ""}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            disabled={deletingId === method.id}
                            onClick={() => handleDelete(method.id)}
                          >
                            {deletingId === method.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Methods */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Add Payment Method</h3>
            <div className="space-y-3">
              {/* Credit/Debit Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card
                  className="p-4 rounded-2xl border-0 shadow-md cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toast.info("Card payments coming soon!")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Credit or Debit Card</h4>
                        <ComingSoonBadge />
                      </div>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, etc.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>

              {/* Mobile Money */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card
                  className="p-4 rounded-2xl border-0 shadow-md cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toast.info("Add more mobile money options in settings")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Mobile Money</h4>
                      <p className="text-sm text-muted-foreground">Suvat Pay, O'mari</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>

              {/* InnBucks — real linking */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.175 }}>
                <Card
                  className="p-4 rounded-2xl border-0 shadow-md cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
                  style={{ borderLeftColor: INNBUCKS_GREEN }}
                  onClick={() => {
                    resetDialog();
                    setLinkOpen(true);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${INNBUCKS_GREEN}15` }}>
                      <Smartphone className="w-6 h-6" style={{ color: INNBUCKS_GREEN }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">InnBucks</h4>
                      <p className="text-sm text-muted-foreground">Link your InnBucks account</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>

              {/* App Wallet */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card
                  className="p-4 rounded-2xl border-0 shadow-md cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toast.info("Your wallet balance can be used for payments")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">App Wallet</h4>
                      <p className="text-sm text-muted-foreground">Pay with your wallet balance</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* InnBucks Linking Modal */}
      <ResponsiveModal open={linkOpen} onOpenChange={setLinkOpen}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" style={{ color: INNBUCKS_GREEN }} />
            Link InnBucks Account
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Enter your InnBucks phone number to verify and link your account.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="px-4 py-4 space-y-4">
          {!inquiryResult ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="e.g. 0771234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={verifying}
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">Zimbabwe format: 07X XXXX XXX or 2637X XXXX XXX</p>
              </div>
              <Button
                className="w-full"
                style={{ backgroundColor: INNBUCKS_GREEN }}
                onClick={handleVerify}
                disabled={verifying || !phone.trim()}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Account"
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl p-4 border" style={{ borderColor: `${INNBUCKS_GREEN}40`, backgroundColor: `${INNBUCKS_GREEN}08` }}>
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-6 h-6" style={{ color: INNBUCKS_GREEN }} />
                  <span className="font-semibold" style={{ color: INNBUCKS_GREEN }}>Account Found</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{inquiryResult.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{inquiryResult.msisdn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">{inquiryResult.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium">{inquiryResult.currency}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full text-white"
                style={{ backgroundColor: INNBUCKS_GREEN }}
                onClick={handleSaveLinked}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  "Link This Account"
                )}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setInquiryResult(null)}>
                Try Different Number
              </Button>
            </div>
          )}
        </div>
      </ResponsiveModal>
    </MobileAppLayout>
  );
};

export default PaymentMethods;
