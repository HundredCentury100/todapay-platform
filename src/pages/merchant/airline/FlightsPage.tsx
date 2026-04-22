import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Plane } from "lucide-react";

const FlightsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Flights</h1>
          <p className="text-muted-foreground">Manage your flight schedules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Flight
        </Button>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Flights Yet</h3>
          <p className="text-muted-foreground mb-4">Add your first flight schedule to start accepting bookings</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Flight
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightsPage;