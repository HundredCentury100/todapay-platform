import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accessibility, Volume2, Eye, Type } from "lucide-react";

const AccessibilityWidget = () => {
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  const applyFontSize = (size: number) => {
    document.documentElement.style.fontSize = `${size}%`;
  };

  const applyHighContrast = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          aria-label="Accessibility Options"
        >
          <Accessibility className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="p-4 border-0 shadow-none">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Options
          </h3>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Font Size: {fontSize}%
                </Label>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={([value]) => {
                  setFontSize(value);
                  applyFontSize(value);
                }}
                min={80}
                max={150}
                step={10}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="contrast" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                High Contrast Mode
              </Label>
              <Switch
                id="contrast"
                checked={highContrast}
                onCheckedChange={(checked) => {
                  setHighContrast(checked);
                  applyHighContrast(checked);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reader" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Screen Reader
              </Label>
              <Switch
                id="reader"
                checked={screenReader}
                onCheckedChange={setScreenReader}
              />
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFontSize(100);
                  setHighContrast(false);
                  setScreenReader(false);
                  applyFontSize(100);
                  applyHighContrast(false);
                }}
              >
                Reset to Default
              </Button>
            </div>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default AccessibilityWidget;
