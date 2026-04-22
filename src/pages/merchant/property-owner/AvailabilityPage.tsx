import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getMerchantProperties } from "@/services/stayService";
import { Property } from "@/types/stay";
import { RoomAvailabilityCalendar } from "@/components/merchant/RoomAvailabilityCalendar";
import { Building2 } from "lucide-react";

const AvailabilityPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (merchantProfile?.id) {
      fetchProperties();
    }
  }, [merchantProfile?.id]);

  const fetchProperties = async () => {
    if (!merchantProfile?.id) return;
    try {
      const data = await getMerchantProperties(merchantProfile.id);
      setProperties(data);
      if (data.length > 0) {
        setSelectedPropertyId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Availability</h1>
        <p className="text-muted-foreground mb-6">Manage room availability and pricing</p>
        
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground">Add a property first to manage room availability</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Availability</h1>
          <p className="text-muted-foreground">Manage room availability and pricing</p>
        </div>
        
        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map(property => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProperty && selectedProperty.rooms && selectedProperty.rooms.length > 0 ? (
        <RoomAvailabilityCalendar 
          propertyId={selectedProperty.id} 
          rooms={selectedProperty.rooms} 
        />
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rooms</h3>
            <p className="text-muted-foreground">Add rooms to this property to manage availability</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityPage;
