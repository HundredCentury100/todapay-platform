import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Accessibility, Baby, Heart, PawPrint, ChevronDown } from "lucide-react";
import { SpecialAssistance, PetTravel } from "@/types/enhancements";
import { cn } from "@/lib/utils";

interface SpecialAssistanceFormProps {
  onAssistanceChange: (assistance: SpecialAssistance) => void;
  onPetChange: (pet: PetTravel) => void;
}

const SpecialAssistanceForm = ({ onAssistanceChange, onPetChange }: SpecialAssistanceFormProps) => {
  const [assistance, setAssistance] = useState<SpecialAssistance>({
    wheelchair: false,
    elderly: false,
    childTravelingAlone: false,
    medical: '',
  });

  const [pet, setPet] = useState<PetTravel>({
    hasPet: false,
    petType: '',
    petWeight: 0,
    petCarrier: false,
  });

  const [isAssistanceOpen, setIsAssistanceOpen] = useState(false);
  const [isPetOpen, setIsPetOpen] = useState(false);

  const handleAssistanceChange = (field: keyof SpecialAssistance, value: any) => {
    const newAssistance = { ...assistance, [field]: value };
    setAssistance(newAssistance);
    onAssistanceChange(newAssistance);
  };

  const handlePetChange = (field: keyof PetTravel, value: any) => {
    const newPet = { ...pet, [field]: value };
    setPet(newPet);
    onPetChange(newPet);
  };

  const assistanceCount = [assistance.wheelchair, assistance.elderly, assistance.childTravelingAlone, assistance.medical].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Special Assistance Section */}
      <Collapsible open={isAssistanceOpen} onOpenChange={setIsAssistanceOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                <h3 className="font-semibold">Special Assistance</h3>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
                {assistanceCount > 0 && !isAssistanceOpen && (
                  <Badge variant="default" className="text-xs">{assistanceCount} selected</Badge>
                )}
              </div>
              <ChevronDown className={cn("w-5 h-5 transition-transform", isAssistanceOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="wheelchair"
                  checked={assistance.wheelchair}
                  onCheckedChange={(checked) => handleAssistanceChange('wheelchair', !!checked)}
                />
                <Label htmlFor="wheelchair" className="font-normal cursor-pointer flex items-center gap-2">
                  <Accessibility className="w-4 h-4" />
                  Wheelchair assistance needed
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="elderly"
                  checked={assistance.elderly}
                  onCheckedChange={(checked) => handleAssistanceChange('elderly', !!checked)}
                />
                <Label htmlFor="elderly" className="font-normal cursor-pointer flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Elderly passenger (priority boarding)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="child"
                  checked={assistance.childTravelingAlone}
                  onCheckedChange={(checked) => handleAssistanceChange('childTravelingAlone', !!checked)}
                />
                <Label htmlFor="child" className="font-normal cursor-pointer flex items-center gap-2">
                  <Baby className="w-4 h-4" />
                  Child traveling alone (supervision needed)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical">Medical Conditions or Special Requests</Label>
                <Textarea
                  id="medical"
                  placeholder="Please describe any medical conditions or special requirements..."
                  value={assistance.medical}
                  onChange={(e) => handleAssistanceChange('medical', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Pet Travel Section */}
      <Collapsible open={isPetOpen} onOpenChange={setIsPetOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5" />
                <h3 className="font-semibold">Pet Travel</h3>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
                {pet.hasPet && !isPetOpen && (
                  <Badge variant="default" className="text-xs">{pet.petType || 'Pet'}</Badge>
                )}
              </div>
              <ChevronDown className={cn("w-5 h-5 transition-transform", isPetOpen && "rotate-180")} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="hasPet"
                  checked={pet.hasPet}
                  onCheckedChange={(checked) => handlePetChange('hasPet', !!checked)}
                />
                <Label htmlFor="hasPet" className="font-normal cursor-pointer">
                  I'm traveling with a pet
                </Label>
              </div>

              {pet.hasPet && (
                <div className="space-y-3 pl-7">
                  <div>
                    <Label htmlFor="petType">Pet Type</Label>
                    <Input
                      id="petType"
                      placeholder="e.g., Dog, Cat"
                      value={pet.petType}
                      onChange={(e) => handlePetChange('petType', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="petWeight">Pet Weight (kg)</Label>
                    <Input
                      id="petWeight"
                      type="number"
                      min="0"
                      value={pet.petWeight || ''}
                      onChange={(e) => handlePetChange('petWeight', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="petCarrier"
                      checked={pet.petCarrier}
                      onCheckedChange={(checked) => handlePetChange('petCarrier', !!checked)}
                    />
                    <Label htmlFor="petCarrier" className="font-normal cursor-pointer">
                      Pet will be in carrier
                    </Label>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Additional pet travel fee may apply. Pets must remain in carriers during journey.
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default SpecialAssistanceForm;
