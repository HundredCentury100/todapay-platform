import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Plus, Minus } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";

interface EventAddon {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  available_quantity: number;
  image?: string;
}

interface EventAddonSelectorProps {
  eventId: string;
  selectedAddons: Record<string, number>;
  onAddonsChange: (addons: Record<string, number>) => void;
  onAddonsTotalChange?: (total: number) => void;
}

const EventAddonSelector = ({
  eventId,
  selectedAddons,
  onAddonsChange,
  onAddonsTotalChange,
}: EventAddonSelectorProps) => {
  const { convertPrice } = useCurrency();
  const [addons, setAddons] = useState<EventAddon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddons();
  }, [eventId]);

  const fetchAddons = async () => {
    const { data, error } = await supabase
      .from("event_addons")
      .select("*")
      .eq("event_id", eventId);

    if (data && !error) {
      setAddons(data);
    }
    setLoading(false);
  };

  const handleQuantityChange = (addonId: string, delta: number) => {
    const currentQuantity = selectedAddons[addonId] || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);
    
    const addon = addons.find((a) => a.id === addonId);
    if (addon && newQuantity <= (addon.available_quantity || Infinity)) {
      const updated = { ...selectedAddons };
      if (newQuantity === 0) {
        delete updated[addonId];
      } else {
        updated[addonId] = newQuantity;
      }
      onAddonsChange(updated);
      
      // Calculate and report total
      if (onAddonsTotalChange) {
        const total = Object.entries(updated).reduce((sum, [id, qty]) => {
          const a = addons.find((x) => x.id === id);
          return sum + (a ? a.price * qty : 0);
        }, 0);
        onAddonsTotalChange(total);
      }
    }
  };

  const getTotalAddonCost = () => {
    return Object.entries(selectedAddons).reduce((total, [addonId, quantity]) => {
      const addon = addons.find((a) => a.id === addonId);
      return total + (addon ? addon.price * quantity : 0);
    }, 0);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading add-ons...</p>
      </Card>
    );
  }

  if (addons.length === 0) {
    return null;
  }

  const addonsByType = addons.reduce((acc, addon) => {
    if (!acc[addon.type]) acc[addon.type] = [];
    acc[addon.type].push(addon);
    return acc;
  }, {} as Record<string, EventAddon[]>);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        Enhance Your Experience
      </h3>

      <div className="space-y-6">
        {Object.entries(addonsByType).map(([type, typeAddons]) => (
          <div key={type}>
            <h4 className="font-medium mb-3 capitalize">{type}</h4>
            <div className="space-y-3">
              {typeAddons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{addon.name}</span>
                      <Badge variant="secondary">{convertPrice(addon.price)}</Badge>
                    </div>
                    {addon.description && (
                      <p className="text-sm text-muted-foreground">{addon.description}</p>
                    )}
                    {addon.available_quantity !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {addon.available_quantity} available
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(addon.id, -1)}
                      disabled={!selectedAddons[addon.id]}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {selectedAddons[addon.id] || 0}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(addon.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(selectedAddons).length > 0 && (
          <div className="pt-4 border-t flex justify-between items-center">
            <span className="font-medium">Add-ons Total:</span>
            <span className="text-lg font-bold">{convertPrice(getTotalAddonCost())}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EventAddonSelector;
