import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getUserPreferences, SavedTraveler, updateUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/contexts/AuthContext";
import { User, ChevronDown, Check, Plus, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TravelerDetails {
  name: string;
  email: string;
  phone: string;
  passportNumber?: string;
}

interface SmartTravelerFormProps {
  value: TravelerDetails;
  onChange: (details: TravelerDetails) => void;
  showPassport?: boolean;
  className?: string;
}

export interface SmartTravelerFormRef {
  saveCurrentTraveler: () => void;
}

export const SmartTravelerForm = forwardRef<SmartTravelerFormRef, SmartTravelerFormProps>(({
  value,
  onChange,
  showPassport = false,
  className,
}, ref) => {
  const { user } = useAuth();
  const [savedTravelers, setSavedTravelers] = useState<SavedTraveler[]>([]);
  const [selectedTravelerId, setSelectedTravelerId] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Load saved travelers on mount
  useEffect(() => {
    const prefs = getUserPreferences();
    setSavedTravelers(prefs.savedTravelers || []);

    // Auto-fill with default traveler if form is empty
    if (!value.name && !value.email && prefs.autoFillDetails) {
      const defaultTraveler = prefs.savedTravelers.find(t => t.id === prefs.defaultTravelerId)
        || prefs.savedTravelers[0];
      
      if (defaultTraveler) {
        onChange({
          name: defaultTraveler.name,
          email: defaultTraveler.email,
          phone: defaultTraveler.phone,
          passportNumber: defaultTraveler.passportNumber,
        });
        setSelectedTravelerId(defaultTraveler.id);
      } else if (user?.email) {
        // Prefill with logged-in user's email
        onChange({ ...value, email: user.email });
      }
    }
  }, []);

  // Check if current values match a saved traveler
  useEffect(() => {
    const matching = savedTravelers.find(
      t => t.name === value.name && t.email === value.email && t.phone === value.phone
    );
    setSelectedTravelerId(matching?.id || null);
    
    // Show save prompt if values don't match any saved traveler and form is filled
    setShowSavePrompt(
      !matching && 
      !!value.name && 
      !!value.email && 
      !!value.phone && 
      savedTravelers.length < 5
    );
  }, [value, savedTravelers]);

  const handleSelectTraveler = (traveler: SavedTraveler) => {
    onChange({
      name: traveler.name,
      email: traveler.email,
      phone: traveler.phone,
      passportNumber: traveler.passportNumber,
    });
    setSelectedTravelerId(traveler.id);
  };

  const handleSaveTraveler = () => {
    if (!value.name || !value.email || !value.phone) return;

    const newTraveler: SavedTraveler = {
      id: `traveler_${Date.now()}`,
      name: value.name,
      email: value.email,
      phone: value.phone,
      passportNumber: value.passportNumber,
      isDefault: savedTravelers.length === 0,
    };

    const updatedTravelers = [...savedTravelers, newTraveler];
    updateUserPreferences("savedTravelers", updatedTravelers);
    setSavedTravelers(updatedTravelers);
    setSelectedTravelerId(newTraveler.id);
    setShowSavePrompt(false);
  };

  // Expose save method via ref
  useImperativeHandle(ref, () => ({
    saveCurrentTraveler: handleSaveTraveler,
  }));

  const selectedTraveler = savedTravelers.find(t => t.id === selectedTravelerId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Saved Travelers Selector */}
      {savedTravelers.length > 0 && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <Users className="h-4 w-4" />
                {selectedTraveler ? selectedTraveler.name : "Select traveler"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {savedTravelers.map((traveler) => (
                <DropdownMenuItem
                  key={traveler.id}
                  onClick={() => handleSelectTraveler(traveler)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{traveler.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{traveler.email}</p>
                  </div>
                  {traveler.id === selectedTravelerId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onChange({ name: "", email: "", phone: "", passportNumber: "" });
                  setSelectedTravelerId(null);
                }}
                className="text-muted-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Enter new details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="traveler-name">Full Name</Label>
          <Input
            id="traveler-name"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="As shown on ID"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="traveler-email">Email</Label>
          <Input
            id="traveler-email"
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="For ticket delivery"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="traveler-phone">Phone</Label>
          <Input
            id="traveler-phone"
            type="tel"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="+263 7X XXX XXXX"
            className="mt-1.5"
          />
        </div>

        {showPassport && (
          <div>
            <Label htmlFor="traveler-passport">Passport Number (Optional)</Label>
            <Input
              id="traveler-passport"
              value={value.passportNumber || ""}
              onChange={(e) => onChange({ ...value, passportNumber: e.target.value })}
              placeholder="For international travel"
              className="mt-1.5"
            />
          </div>
        )}
      </div>

      {/* Save Traveler Prompt */}
      {showSavePrompt && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10"
        >
          <User className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm flex-1">Save these details for faster checkout?</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveTraveler}
            className="h-8 px-3 text-primary"
          >
            Save
          </Button>
        </motion.div>
      )}
    </div>
  );
});

SmartTravelerForm.displayName = "SmartTravelerForm";
