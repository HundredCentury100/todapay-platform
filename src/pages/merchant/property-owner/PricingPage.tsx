import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { getMerchantProperties, updateRoom } from "@/services/stayService";
import { Property, Room } from "@/types/stay";
import { SeasonalPricingEditor } from "@/components/merchant/SeasonalPricingEditor";
import { DollarSign, Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

const PricingPage = () => {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [editedPrices, setEditedPrices] = useState<Record<string, { base_price: number; cleaning_fee: number }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (merchantProfile?.id) fetchProperties();
  }, [merchantProfile?.id]);

  const fetchProperties = async () => {
    if (!merchantProfile?.id) return;
    try {
      const data = await getMerchantProperties(merchantProfile.id);
      setProperties(data);
      if (data.length > 0) setSelectedPropertyId(data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const rooms = selectedProperty?.rooms || [];

  const getPrice = (room: Room) => editedPrices[room.id] || { base_price: room.base_price, cleaning_fee: (room as any).cleaning_fee || 0 };

  const handlePriceChange = (roomId: string, field: 'base_price' | 'cleaning_fee', value: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    setEditedPrices(prev => ({
      ...prev,
      [roomId]: {
        ...getPrice(room),
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editedPrices);
      for (const [roomId, prices] of updates) {
        await updateRoom(roomId, { base_price: prices.base_price } as any);
      }
      toast.success(`Updated ${updates.length} room price(s)`);
      setEditedPrices({});
      await fetchProperties();
    } catch (e) {
      toast.error("Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Pricing</h1>
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground">Add a property first to manage pricing</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pricing</h1>
          <p className="text-muted-foreground">Manage base prices, cleaning fees, and seasonal rules</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {Object.keys(editedPrices).length > 0 && (
            <Button onClick={handleSaveAll} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Room Price Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Room Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No rooms in this property. Add rooms first.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium">Room</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Base Price/Night</th>
                    <th className="text-left py-3 px-4 font-medium">Cleaning Fee</th>
                    <th className="text-left py-3 px-4 font-medium">Max Guests</th>
                    <th className="text-left py-3 pl-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => {
                    const prices = getPrice(room);
                    const isEdited = !!editedPrices[room.id];
                    return (
                      <tr key={room.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4">
                          <span className="font-medium">{room.name}</span>
                          {isEdited && <Badge variant="outline" className="ml-2 text-xs">Modified</Badge>}
                        </td>
                        <td className="py-3 px-4 capitalize text-muted-foreground">
                          {room.room_type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            className="w-28 h-8"
                            value={prices.base_price}
                            onChange={(e) => handlePriceChange(room.id, 'base_price', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            className="w-28 h-8"
                            value={prices.cleaning_fee}
                            onChange={(e) => handlePriceChange(room.id, 'cleaning_fee', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{room.max_guests}</td>
                        <td className="py-3 pl-4">
                          <Badge variant={room.status === 'active' ? 'default' : 'secondary'}>
                            {room.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seasonal Pricing */}
      {selectedPropertyId && (
        <SeasonalPricingEditor
          propertyId={selectedPropertyId}
          roomIds={rooms.map(r => r.id)}
        />
      )}
    </div>
  );
};

export default PricingPage;
