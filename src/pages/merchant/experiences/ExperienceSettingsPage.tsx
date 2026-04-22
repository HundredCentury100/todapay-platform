import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Bell } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumSettingsCard, PremiumFormField } from "@/components/premium";

const ExperienceSettingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-8">
      <PremiumPageHeader
        title="Settings"
        subtitle="Manage your experience host settings"
      />

      <PremiumSection delay={0.1} className="space-y-6">
        <PremiumSettingsCard
          icon={Compass}
          title="Host Information"
          description="Update your host details"
          delay={0.15}
        >
          <PremiumFormField label="Host Name / Business Name">
            <Input placeholder="Enter your name or business name" className="bg-background/50" />
          </PremiumFormField>
          <PremiumFormField label="Contact Email">
            <Input type="email" placeholder="Enter contact email" className="bg-background/50" />
          </PremiumFormField>
          <PremiumFormField label="Contact Phone">
            <Input placeholder="Enter contact phone" className="bg-background/50" />
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
      </PremiumSection>
    </div>
  );
};

export default ExperienceSettingsPage;