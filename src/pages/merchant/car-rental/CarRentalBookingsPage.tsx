import { useState } from "react";
import { Car, Clock, CheckCircle, XCircle } from "lucide-react";
import { PremiumPageHeader, PremiumSection, PremiumTabs, PremiumTabContent, PremiumEmptyState } from "@/components/premium";

const CarRentalBookingsPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  
  const tabs = [
    { value: "active", label: "Active" },
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PremiumPageHeader
        title="Rentals"
        subtitle="Manage your vehicle rentals"
      />

      <PremiumSection delay={0.1}>
        <PremiumTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="mt-4">
          <PremiumTabContent value="active" activeValue={activeTab}>
            <PremiumEmptyState
              icon={Car}
              title="No Active Rentals"
              description="Vehicles currently on rent will appear here"
            />
          </PremiumTabContent>

          <PremiumTabContent value="upcoming" activeValue={activeTab}>
            <PremiumEmptyState
              icon={Clock}
              title="No Upcoming Rentals"
              description="Future bookings will appear here"
            />
          </PremiumTabContent>

          <PremiumTabContent value="completed" activeValue={activeTab}>
            <PremiumEmptyState
              icon={CheckCircle}
              title="No Completed Rentals"
              description="Past rentals will appear here"
            />
          </PremiumTabContent>

          <PremiumTabContent value="cancelled" activeValue={activeTab}>
            <PremiumEmptyState
              icon={XCircle}
              title="No Cancelled Rentals"
              description="Cancelled bookings will appear here"
            />
          </PremiumTabContent>
        </div>
      </PremiumSection>
    </div>
  );
};

export default CarRentalBookingsPage;