import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PropertyPriceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city?: string;
  propertyType?: string;
  currentPrice?: number;
}

const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'lodge', label: 'Lodge' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'guesthouse', label: 'Guesthouse' },
  { value: 'resort', label: 'Resort' },
];

export function PropertyPriceAlertDialog({
  open,
  onOpenChange,
  city: initialCity = '',
  propertyType: initialType = '',
  currentPrice = 0
}: PropertyPriceAlertDialogProps) {
  const { user } = useAuth();
  const [city, setCity] = useState(initialCity);
  const [propertyType, setPropertyType] = useState(initialType);
  const [targetPrice, setTargetPrice] = useState(
    currentPrice ? Math.round(currentPrice * 0.8).toString() : ''
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create price alerts');
      return;
    }

    if (!city || !targetPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('property_price_alerts')
        .insert({
          user_id: user.id,
          city,
          property_type: propertyType || null,
          target_price: parseFloat(targetPrice),
          is_active: true
        });

      if (error) throw error;

      toast.success('Price alert created! We\'ll notify you when prices drop.');
      onOpenChange(false);
      
      // Reset form
      setCity(initialCity);
      setPropertyType(initialType);
      setTargetPrice('');
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create price alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when property prices drop below your target.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Harare"
            />
          </div>

          <div>
            <Label htmlFor="type">Property Type (Optional)</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Any property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any property type</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="price">Target Price (per night) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R
              </span>
              <Input
                id="price"
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                min="0"
                step="50"
              />
            </div>
            {currentPrice > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Current average: R{currentPrice.toFixed(0)}/night
              </p>
            )}
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">How it works:</p>
            <ul className="text-muted-foreground text-xs mt-1 space-y-1">
              <li>• We check prices daily for properties matching your criteria</li>
              <li>• You'll get an email when prices drop below R{targetPrice || '0'}/night</li>
              <li>• Alerts can be managed in your account settings</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !city || !targetPrice}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
