import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Bell, Shield } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumSettingsCard, PremiumFormField } from "@/components/premium";

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-8">
      <PremiumPageHeader
        title="Settings"
        subtitle="Manage your property business settings"
      />

      <PremiumSection delay={0.1} className="space-y-6">
        <PremiumSettingsCard
          icon={Building2}
          title="Business Information"
          description="Update your business details"
          delay={0.15}
        >
          <PremiumFormField label="Business Name">
            <Input placeholder="Enter business name" className="bg-background/50" />
          </PremiumFormField>
          <PremiumFormField label="Business Email">
            <Input type="email" placeholder="Enter business email" className="bg-background/50" />
          </PremiumFormField>
          <PremiumFormField label="Business Phone">
            <Input placeholder="Enter business phone" className="bg-background/50" />
          </PremiumFormField>
          <PremiumFormField label="Business Address">
            <Textarea placeholder="Enter business address" className="bg-background/50 min-h-[100px]" />
          </PremiumFormField>
          <Button className="w-full sm:w-auto">Save Changes</Button>
        </PremiumSettingsCard>

        <PremiumSettingsCard
          icon={Bell}
          title="Notifications"
          description="Configure notification preferences"
          delay={0.2}
        >
          <p className="text-muted-foreground text-sm">Notification settings coming soon</p>
        </PremiumSettingsCard>

        <PremiumSettingsCard
          icon={Shield}
          title="Security"
          description="Manage security settings"
          delay={0.25}
        >
          <p className="text-muted-foreground text-sm">Security settings coming soon</p>
        </PremiumSettingsCard>
      </PremiumSection>
    </div>
  );
};

export default SettingsPage;