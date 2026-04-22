import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Percent, Loader2, Trash2 } from 'lucide-react';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SeasonalPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  existingRule?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    price_multiplier: number;
  };
  onSuccess?: () => void;
}

export function SeasonalPricingDialog({
  open,
  onOpenChange,
  propertyId,
  existingRule,
  onSuccess
}: SeasonalPricingDialogProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [multiplier, setMultiplier] = useState('1.0');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (existingRule) {
      setName(existingRule.name);
      setStartDate(new Date(existingRule.start_date));
      setEndDate(new Date(existingRule.end_date));
      setMultiplier(existingRule.price_multiplier.toString());
    } else {
      setName('');
      setStartDate(undefined);
      setEndDate(undefined);
      setMultiplier('1.0');
    }
  }, [existingRule, open]);

  const handleSubmit = async () => {
    if (!name || !startDate || !endDate || !multiplier) {
      toast.error('Please fill in all fields');
      return;
    }

    const mult = parseFloat(multiplier);
    if (isNaN(mult) || mult <= 0) {
      toast.error('Price multiplier must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      if (existingRule) {
        const { error } = await supabase
          .from('seasonal_pricing_rules')
          .update({
            name,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
            price_multiplier: mult
          })
          .eq('id', existingRule.id);

        if (error) throw error;
        toast.success('Pricing rule updated');
      } else {
        const { error } = await supabase
          .from('seasonal_pricing_rules')
          .insert({
            property_id: propertyId,
            name,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
            price_multiplier: mult
          });

        if (error) throw error;
        toast.success('Pricing rule created');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save pricing rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRule) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('seasonal_pricing_rules')
        .delete()
        .eq('id', existingRule.id);

      if (error) throw error;
      toast.success('Pricing rule deleted');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete pricing rule');
    } finally {
      setDeleting(false);
    }
  };

  const percentageChange = ((parseFloat(multiplier) - 1) * 100).toFixed(0);
  const isIncrease = parseFloat(multiplier) > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRule ? 'Edit Seasonal Pricing' : 'Add Seasonal Pricing'}
          </DialogTitle>
          <DialogDescription>
            Set price adjustments for specific date ranges (peak season, holidays, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Peak Season, Christmas Holiday"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="multiplier">Price Multiplier</Label>
            <div className="flex gap-3 items-center">
              <Input
                id="multiplier"
                type="number"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                placeholder="1.0"
                min="0.1"
                step="0.1"
                className="flex-1"
              />
              <div className="flex items-center gap-1 text-sm">
                <Percent className="h-4 w-4" />
                <span className={cn(
                  isIncrease ? 'text-red-600' : 'text-green-600'
                )}>
                  {isIncrease ? '+' : ''}{percentageChange}%
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1.0 = normal price, 1.5 = 50% increase, 0.8 = 20% discount
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">Preview:</p>
            <p className="text-muted-foreground">
              {name || 'Rule'} - {startDate && endDate ? (
                `${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d, yyyy')}`
              ) : 'Select dates'}
              {' '}- {isIncrease ? 'Increase' : 'Decrease'} prices by {Math.abs(parseInt(percentageChange))}%
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {existingRule && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="mr-auto"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
