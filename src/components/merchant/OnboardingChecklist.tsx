import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle, Circle, Upload, Package, CreditCard, X, Rocket,
} from "lucide-react";

interface OnboardingChecklistProps {
  merchantProfileId?: string;
  verificationStatus?: string;
  role?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href: string;
  icon: React.ElementType;
}

export const OnboardingChecklist = ({
  merchantProfileId,
  verificationStatus,
  role,
}: OnboardingChecklistProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [hasService, setHasService] = useState(false);
  const [hasKYC, setHasKYC] = useState(false);

  useEffect(() => {
    if (!user || !merchantProfileId) return;

    const checkProgress = async () => {
      // Check if KYC documents uploaded
      const { count: kycCount } = await supabase
        .from("user_kyc_documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setHasKYC((kycCount || 0) > 0);

      // Role-aware service detection
      const roleTableMap: Record<string, { table: string; filter?: { key: string; value: string } }> = {
        bus_operator: { table: "bus_schedules" },
        venue_owner: { table: "venues", filter: { key: "merchant_profile_id", value: merchantProfileId } },
        property_owner: { table: "properties", filter: { key: "merchant_profile_id", value: merchantProfileId } },
        car_rental_company: { table: "vehicles", filter: { key: "merchant_profile_id", value: merchantProfileId } },
        experience_host: { table: "experiences", filter: { key: "merchant_profile_id", value: merchantProfileId } },
        workspace_provider: { table: "workspaces", filter: { key: "merchant_profile_id", value: merchantProfileId } },
        event_organizer: { table: "events", filter: { key: "merchant_profile_id", value: merchantProfileId } },
        transfer_provider: { table: "transfer_services", filter: { key: "merchant_profile_id", value: merchantProfileId } },
      };

      const currentRole = role || '';
      const config = roleTableMap[currentRole];
      if (config) {
        let query = supabase.from(config.table as any).select("id", { count: "exact", head: true });
        if (config.filter) {
          query = query.eq(config.filter.key, config.filter.value);
        }
        const { count } = await query.limit(1);
        setHasService((count || 0) > 0);
      }
    };

    checkProgress();

    // Check localStorage for dismiss
    const key = `onboarding_dismissed_${merchantProfileId}`;
    if (localStorage.getItem(key) === "true") {
      setDismissed(true);
    }
  }, [user, merchantProfileId]);

  if (dismissed) return null;

  const items: ChecklistItem[] = [
    {
      id: "account",
      label: "Create Account",
      done: true,
      href: "#",
      icon: CheckCircle,
    },
    {
      id: "kyc",
      label: "Submit KYC Documents",
      done: hasKYC,
      href: "/account?tab=kyc",
      icon: Upload,
    },
    {
      id: "service",
      label: "Add Your First Service",
      done: hasService,
      href: "#",
      icon: Package,
    },
    {
      id: "payment",
      label: "Configure Payment Settings",
      done: false,
      href: role ? `/merchant/${role === "bus_operator" ? "bus-operator" : role}/payment-settings` : "#",
      icon: CreditCard,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const progress = (completedCount / items.length) * 100;

  if (completedCount === items.length) return null;

  const handleDismiss = () => {
    if (merchantProfileId) {
      localStorage.setItem(`onboarding_dismissed_${merchantProfileId}`, "true");
    }
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Complete your setup to go live</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedCount}/{items.length} steps completed
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Progress value={progress} className="h-1.5 mb-4" />

          <div className="grid gap-2">
            {items.map((item) => {
              const Icon = item.done ? CheckCircle : item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => !item.done && item.href !== "#" && navigate(item.href)}
                  disabled={item.done || item.href === "#"}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-left text-sm transition-colors ${
                    item.done
                      ? "text-muted-foreground"
                      : "hover:bg-primary/5 cursor-pointer"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.done ? "line-through" : "font-medium"}>
                    {item.label}
                  </span>
                  {!item.done && item.href !== "#" && (
                    <span className="ml-auto text-xs text-primary font-medium">Start →</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OnboardingChecklist;
