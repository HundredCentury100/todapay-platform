import { Button } from "@/components/ui/button";
import { Plus, Compass } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumEmptyState } from "@/components/premium";

const ExperiencesListPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PremiumPageHeader
        title="My Experiences"
        subtitle="Manage your tours and activities"
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        }
      />

      <PremiumSection delay={0.1}>
        <PremiumEmptyState
          icon={Compass}
          title="No Experiences Yet"
          description="Add your first experience to start accepting bookings"
          action={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Experience
            </Button>
          }
        />
      </PremiumSection>
    </div>
  );
};

export default ExperiencesListPage;