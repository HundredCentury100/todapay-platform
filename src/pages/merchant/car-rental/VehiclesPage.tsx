import { Button } from "@/components/ui/button";
import { Plus, Car } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumEmptyState } from "@/components/premium";

const VehiclesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PremiumPageHeader
        title="Vehicles"
        subtitle="Manage your vehicle fleet"
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        }
      />

      <PremiumSection delay={0.1}>
        <PremiumEmptyState
          icon={Car}
          title="No Vehicles Yet"
          description="Add your first vehicle to start accepting rentals"
          action={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Vehicle
            </Button>
          }
        />
      </PremiumSection>
    </div>
  );
};

export default VehiclesPage;