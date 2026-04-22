import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UtensilsCrossed, Wrench } from "lucide-react";
import { CateringOption, VenueEquipment } from "@/types/venue";

interface VenuePackageBuilderProps {
  cateringOptions: CateringOption[];
  equipmentAvailable: VenueEquipment[];
  selectedCatering: string[];
  selectedEquipment: string[];
  onCateringChange: (ids: string[]) => void;
  onEquipmentChange: (ids: string[]) => void;
  guestCount: number;
}

const VenuePackageBuilder = ({
  cateringOptions,
  equipmentAvailable,
  selectedCatering,
  selectedEquipment,
  onCateringChange,
  onEquipmentChange,
  guestCount,
}: VenuePackageBuilderProps) => {
  const toggleCatering = (id: string) => {
    onCateringChange(
      selectedCatering.includes(id)
        ? selectedCatering.filter((c) => c !== id)
        : [...selectedCatering, id]
    );
  };

  const toggleEquipment = (id: string) => {
    onEquipmentChange(
      selectedEquipment.includes(id)
        ? selectedEquipment.filter((e) => e !== id)
        : [...selectedEquipment, id]
    );
  };

  const cateringTotal = selectedCatering.reduce((sum, id) => {
    const opt = cateringOptions.find((c) => c.id === id);
    return opt ? sum + opt.price_per_person * (guestCount || 1) : sum;
  }, 0);

  const equipmentTotal = selectedEquipment.reduce((sum, id) => {
    const eq = equipmentAvailable.find((e) => e.id === id);
    return eq ? sum + eq.price : sum;
  }, 0);

  const total = cateringTotal + equipmentTotal;

  if (cateringOptions.length === 0 && equipmentAvailable.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        🎨 Customize Your Package
      </h4>

      {cateringOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
            <UtensilsCrossed className="h-4 w-4" /> Catering
          </p>
          <div className="space-y-2">
            {cateringOptions.map((opt) => {
              const isSelected = selectedCatering.includes(opt.id);
              const itemTotal = opt.price_per_person * (guestCount || 1);
              return (
                <Card
                  key={opt.id}
                  className={`border transition-colors cursor-pointer ${isSelected ? "border-primary bg-primary/5" : "border-border/50"}`}
                  onClick={() => toggleCatering(opt.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{opt.name}</p>
                      {opt.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{opt.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        ${opt.price_per_person}/person × {guestCount || 1} = <span className="font-medium text-foreground">${itemTotal.toLocaleString()}</span>
                      </p>
                    </div>
                    <Switch checked={isSelected} onCheckedChange={() => toggleCatering(opt.id)} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {equipmentAvailable.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
            <Wrench className="h-4 w-4" /> Equipment
          </p>
          <div className="space-y-2">
            {equipmentAvailable.map((eq) => {
              const isSelected = selectedEquipment.includes(eq.id);
              return (
                <Card
                  key={eq.id}
                  className={`border transition-colors cursor-pointer ${isSelected ? "border-primary bg-primary/5" : "border-border/50"}`}
                  onClick={() => toggleEquipment(eq.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{eq.name}</p>
                      {eq.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{eq.description}</p>
                      )}
                      <p className="text-xs font-medium text-foreground mt-1">${eq.price.toLocaleString()}</p>
                    </div>
                    <Switch checked={isSelected} onCheckedChange={() => toggleEquipment(eq.id)} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {total > 0 && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Add-ons Total</span>
            <Badge variant="secondary" className="text-sm font-bold">
              ${total.toLocaleString()}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
};

export default VenuePackageBuilder;
