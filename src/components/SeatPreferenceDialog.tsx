import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { SeatPreference } from "@/types/enhancements";

interface SeatPreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (preferences: SeatPreference) => void;
}

const SeatPreferenceDialog = ({ open, onOpenChange, onSave }: SeatPreferenceDialogProps) => {
  const [preferences, setPreferences] = useState<SeatPreference>({
    windowOrAisle: 'any',
    position: 'any',
    quietZone: false,
    nearExit: false,
  });

  const handleSave = () => {
    onSave(preferences);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Seat Preferences</DialogTitle>
          <DialogDescription>
            Tell us your preferences and we'll recommend the best seats for you
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Window or Aisle?</Label>
            <RadioGroup
              value={preferences.windowOrAisle}
              onValueChange={(value) => setPreferences({ ...preferences, windowOrAisle: value as any })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="window" id="window" />
                <Label htmlFor="window" className="font-normal cursor-pointer">Window</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aisle" id="aisle" />
                <Label htmlFor="aisle" className="font-normal cursor-pointer">Aisle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="any-wa" />
                <Label htmlFor="any-wa" className="font-normal cursor-pointer">No Preference</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Position in Bus</Label>
            <RadioGroup
              value={preferences.position}
              onValueChange={(value) => setPreferences({ ...preferences, position: value as any })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="front" id="front" />
                <Label htmlFor="front" className="font-normal cursor-pointer">Front (Smooth ride)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="middle" id="middle" />
                <Label htmlFor="middle" className="font-normal cursor-pointer">Middle (Balanced)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="back" id="back" />
                <Label htmlFor="back" className="font-normal cursor-pointer">Back (More space)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="any-pos" />
                <Label htmlFor="any-pos" className="font-normal cursor-pointer">No Preference</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Additional Preferences</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="quiet"
                checked={preferences.quietZone}
                onCheckedChange={(checked) => setPreferences({ ...preferences, quietZone: !!checked })}
              />
              <Label htmlFor="quiet" className="font-normal cursor-pointer">Quiet zone preferred</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exit"
                checked={preferences.nearExit}
                onCheckedChange={(checked) => setPreferences({ ...preferences, nearExit: !!checked })}
              />
              <Label htmlFor="exit" className="font-normal cursor-pointer">Near exit/restroom</Label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Get Recommendations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeatPreferenceDialog;
