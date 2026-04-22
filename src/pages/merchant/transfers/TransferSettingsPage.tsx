import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarTaxiFront, Bell, Loader2 } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumSettingsCard, PremiumFormField } from "@/components/premium";
import { supabase } from "@/integrations/supabase/client";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { toast } from "sonner";

const TransferSettingsPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing values
  useEffect(() => {
    if (merchantProfile && !loaded) {
      setBusinessName(merchantProfile.business_name || "");
      setContactEmail((merchantProfile as any).business_email || "");
      setContactPhone((merchantProfile as any).business_phone || "");
      setLoaded(true);
    }
  }, [merchantProfile, loaded]);

  const handleSave = async () => {
    if (!merchantProfile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("merchant_profiles")
        .update({
          business_name: businessName,
          business_email: contactEmail,
          business_phone: contactPhone,
        })
        .eq("id", merchantProfile.id);
      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-8">
      <PremiumPageHeader title="Settings" subtitle="Manage your transfer service settings" />

      <PremiumSection delay={0.1} className="space-y-6">
        <PremiumSettingsCard
          icon={CarTaxiFront}
          title="Business Information"
          description="Update your business details"
          delay={0.15}
        >
          <PremiumFormField label="Business Name">
            <Input
              placeholder="Enter business name"
              className="bg-background/50"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </PremiumFormField>
          <PremiumFormField label="Contact Email">
            <Input
              type="email"
              placeholder="Enter contact email"
              className="bg-background/50"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </PremiumFormField>
          <PremiumFormField label="Contact Phone">
            <Input
              placeholder="Enter contact phone"
              className="bg-background/50"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </PremiumFormField>
          <Button className="w-full sm:w-auto gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </PremiumSettingsCard>

        <PremiumSettingsCard
          icon={Bell}
          title="Notifications"
          description="Configure notification preferences"
          delay={0.2}
        >
          <p className="text-muted-foreground text-sm">Notification settings coming soon</p>
        </PremiumSettingsCard>
      </PremiumSection>
    </div>
  );
};

export default TransferSettingsPage;
