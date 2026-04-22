import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, DollarSign, X, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BulkScheduleOperationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: any[];
  onSuccess: () => void;
}

export function BulkScheduleOperations({ open, onOpenChange, schedules, onSuccess }: BulkScheduleOperationsProps) {
  const [operation, setOperation] = useState<'recurring' | 'price' | 'cancel'>('recurring');
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Recurring schedule fields
  const [recurringData, setRecurringData] = useState({
    pattern: 'daily',
    startDate: '',
    endDate: '',
    daysOfWeek: [] as number[],
  });

  // Price update fields
  const [priceData, setPriceData] = useState({
    updateType: 'percentage',
    value: 0,
  });

  // Cancellation fields
  const [cancellationData, setCancellationData] = useState({
    reason: '',
    notifyCustomers: true,
  });

  const handleRecurringSchedules = async () => {
    if (selectedSchedules.length === 0) {
      toast.error("Please select at least one schedule");
      return;
    }

    setLoading(true);
    try {
      const baseSchedule = schedules.find(s => s.id === selectedSchedules[0]);
      if (!baseSchedule) throw new Error("Base schedule not found");

      const startDate = new Date(recurringData.startDate);
      const endDate = new Date(recurringData.endDate);
      const newSchedules = [];

      if (recurringData.pattern === 'daily') {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          newSchedules.push({
            bus_id: baseSchedule.bus_id,
            from_location: baseSchedule.from_location,
            to_location: baseSchedule.to_location,
            departure_time: baseSchedule.departure_time,
            arrival_time: baseSchedule.arrival_time,
            duration: baseSchedule.duration,
            base_price: baseSchedule.base_price,
            available_date: d.toISOString().split('T')[0],
            stops: baseSchedule.stops,
          });
        }
      } else if (recurringData.pattern === 'weekly') {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (recurringData.daysOfWeek.includes(d.getDay())) {
            newSchedules.push({
              bus_id: baseSchedule.bus_id,
              from_location: baseSchedule.from_location,
              to_location: baseSchedule.to_location,
              departure_time: baseSchedule.departure_time,
              arrival_time: baseSchedule.arrival_time,
              duration: baseSchedule.duration,
              base_price: baseSchedule.base_price,
              available_date: d.toISOString().split('T')[0],
              stops: baseSchedule.stops,
            });
          }
        }
      }

      const { error } = await supabase.from('bus_schedules').insert(newSchedules);
      if (error) throw error;

      toast.success(`Created ${newSchedules.length} recurring schedules`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create recurring schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (selectedSchedules.length === 0) {
      toast.error("Please select at least one schedule");
      return;
    }

    setLoading(true);
    try {
      const schedulesToUpdate = schedules.filter(s => selectedSchedules.includes(s.id));
      
      const updates = schedulesToUpdate.map(schedule => {
        let newPrice = schedule.base_price;
        if (priceData.updateType === 'percentage') {
          newPrice = schedule.base_price * (1 + priceData.value / 100);
        } else {
          newPrice = schedule.base_price + priceData.value;
        }
        
        return {
          id: schedule.id,
          base_price: Math.round(newPrice * 100) / 100,
        };
      });

      for (const update of updates) {
        const { error } = await supabase
          .from('bus_schedules')
          .update({ base_price: update.base_price })
          .eq('id', update.id);
        if (error) throw error;
      }

      toast.success(`Updated prices for ${updates.length} schedules`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update prices");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCancellation = async () => {
    if (selectedSchedules.length === 0) {
      toast.error("Please select at least one schedule");
      return;
    }

    setLoading(true);
    try {
      // Get affected bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .in('item_id', selectedSchedules)
        .eq('booking_type', 'bus');

      // Delete schedules
      const { error: deleteError } = await supabase
        .from('bus_schedules')
        .delete()
        .in('id', selectedSchedules);

      if (deleteError) throw deleteError;

      // Send notifications if enabled
      if (cancellationData.notifyCustomers && bookings && bookings.length > 0) {
        // In production, integrate with email service
        console.log(`Would notify ${bookings.length} customers about cancellation`);
      }

      toast.success(`Cancelled ${selectedSchedules.length} schedules`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel schedules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (operation === 'recurring') {
      await handleRecurringSchedules();
    } else if (operation === 'price') {
      await handleBulkPriceUpdate();
    } else if (operation === 'cancel') {
      await handleBulkCancellation();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Schedule Operations</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Operation Type</Label>
            <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">Create Recurring Schedules</SelectItem>
                <SelectItem value="price">Bulk Price Update</SelectItem>
                <SelectItem value="cancel">Bulk Cancellation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Select Schedules</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
              {schedules.map(schedule => (
                <div key={schedule.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedSchedules.includes(schedule.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSchedules([...selectedSchedules, schedule.id]);
                      } else {
                        setSelectedSchedules(selectedSchedules.filter(id => id !== schedule.id));
                      }
                    }}
                  />
                  <span className="text-sm">
                    {schedule.from_location} → {schedule.to_location} ({new Date(schedule.available_date).toLocaleDateString()})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {operation === 'recurring' && (
            <>
              <div>
                <Label>Pattern</Label>
                <Select value={recurringData.pattern} onValueChange={(v) => setRecurringData({...recurringData, pattern: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly (Select Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurringData.pattern === 'weekly' && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex gap-2 flex-wrap">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <Button
                        key={day}
                        type="button"
                        variant={recurringData.daysOfWeek.includes(idx) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (recurringData.daysOfWeek.includes(idx)) {
                            setRecurringData({
                              ...recurringData,
                              daysOfWeek: recurringData.daysOfWeek.filter(d => d !== idx)
                            });
                          } else {
                            setRecurringData({
                              ...recurringData,
                              daysOfWeek: [...recurringData.daysOfWeek, idx]
                            });
                          }
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={recurringData.startDate}
                    onChange={(e) => setRecurringData({...recurringData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={recurringData.endDate}
                    onChange={(e) => setRecurringData({...recurringData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {operation === 'price' && (
            <>
              <div>
                <Label>Update Type</Label>
                <Select value={priceData.updateType} onValueChange={(v) => setPriceData({...priceData, updateType: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Change</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {priceData.updateType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceData.value}
                  onChange={(e) => setPriceData({...priceData, value: parseFloat(e.target.value)})}
                  placeholder={priceData.updateType === 'percentage' ? 'e.g., 10 for +10%' : 'e.g., 5 for +$5'}
                  required
                />
              </div>
            </>
          )}

          {operation === 'cancel' && (
            <>
              <div>
                <Label>Cancellation Reason</Label>
                <Input
                  value={cancellationData.reason}
                  onChange={(e) => setCancellationData({...cancellationData, reason: e.target.value})}
                  placeholder="e.g., Vehicle maintenance"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={cancellationData.notifyCustomers}
                  onCheckedChange={(checked) => setCancellationData({...cancellationData, notifyCustomers: !!checked})}
                />
                <Label>Notify affected customers via email</Label>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedSchedules.length === 0}>
              {loading ? "Processing..." : "Apply Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
