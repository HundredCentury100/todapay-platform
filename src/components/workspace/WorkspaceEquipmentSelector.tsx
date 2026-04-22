import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Monitor, Mic, Camera, Lightbulb, Headphones } from "lucide-react";
import { WORKSPACE_EQUIPMENT } from "@/types/workspace";
import { useCurrency } from "@/contexts/CurrencyContext";

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface WorkspaceEquipmentSelectorProps {
  selectedEquipment: EquipmentItem[];
  onEquipmentChange: (equipment: EquipmentItem[]) => void;
  bookingHours?: number;
}

const EQUIPMENT_ICONS: Record<string, React.ReactNode> = {
  monitor_4k: <Monitor className="h-5 w-5" />,
  webcam_hd: <Camera className="h-5 w-5" />,
  ring_light: <Lightbulb className="h-5 w-5" />,
  green_screen: <Camera className="h-5 w-5" />,
  microphone: <Mic className="h-5 w-5" />,
  headphones: <Headphones className="h-5 w-5" />,
};

export const WorkspaceEquipmentSelector = ({
  selectedEquipment,
  onEquipmentChange,
  bookingHours = 1,}: WorkspaceEquipmentSelectorProps) => {
  const { convertPrice } = useCurrency();
  const getItemQuantity = (id: string) => {
    const item = selectedEquipment.find((e) => e.id === id);
    return item?.quantity || 0;
  };

  const updateQuantity = (id: string, name: string, pricePerHour: number, delta: number) => {
    const currentQuantity = getItemQuantity(id);
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0) {
      onEquipmentChange(selectedEquipment.filter((e) => e.id !== id));
    } else {
      const existing = selectedEquipment.find((e) => e.id === id);
      if (existing) {
        onEquipmentChange(
          selectedEquipment.map((e) =>
            e.id === id ? { ...e, quantity: newQuantity, price: pricePerHour * bookingHours } : e
          )
        );
      } else {
        onEquipmentChange([
          ...selectedEquipment,
          { id, name, quantity: newQuantity, price: pricePerHour * bookingHours },
        ]);
      }
    }
  };

  const totalCost = selectedEquipment.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Add Equipment</span>
          {totalCost > 0 && (
            <Badge variant="secondary">+{convertPrice(totalCost)}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {WORKSPACE_EQUIPMENT.map((item) => {
          const quantity = getItemQuantity(item.id);
          const itemTotal = item.price_per_hour * bookingHours;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {EQUIPMENT_ICONS[item.id] || <Monitor className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {convertPrice(item.price_per_hour)}/hour
                    {bookingHours > 1 && ` (${convertPrice(itemTotal)} total)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.name, item.price_per_hour, -1)}
                  disabled={quantity === 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.name, item.price_per_hour, 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default WorkspaceEquipmentSelector;
