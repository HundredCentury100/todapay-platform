import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingPolicyManagerProps {
  policyType: "bus" | "event";
  merchantProfileId: string;
}

const BookingPolicyManager = ({ policyType, merchantProfileId }: BookingPolicyManagerProps) => {
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState({
    cancellation_window_hours: 24,
    full_refund_percentage: 100,
    partial_refund_percentage: 50,
    partial_refund_window_hours: 48,
    no_refund_window_hours: 6,
    reschedule_fee: 0,
    reschedule_allowed: true,
    max_reschedules: 2,
    automated_enforcement: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPolicy();
  }, [policyType]);

  const loadPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('booking_policies')
        .select('*')
        .eq('policy_type', policyType)
        .eq('merchant_profile_id', merchantProfileId)
        .single();

      if (error) {
        console.log('No policy found, using defaults');
        return;
      }

      if (data) {
        setPolicy({
          cancellation_window_hours: data.cancellation_window_hours,
          full_refund_percentage: data.full_refund_percentage,
          partial_refund_percentage: data.partial_refund_percentage,
          partial_refund_window_hours: data.partial_refund_window_hours,
          no_refund_window_hours: data.no_refund_window_hours,
          reschedule_fee: data.reschedule_fee,
          reschedule_allowed: data.reschedule_allowed,
          max_reschedules: data.max_reschedules,
          automated_enforcement: data.automated_enforcement,
        });
      }
    } catch (error) {
      console.error('Error loading policy:', error);
    }
  };

  const savePolicy = async () => {
    setLoading(true);
    try {
      // Check if policy exists
      const { data: existing } = await supabase
        .from('booking_policies')
        .select('id')
        .eq('policy_type', policyType)
        .eq('merchant_profile_id', merchantProfileId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('booking_policies')
          .update({
            ...policy,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('booking_policies')
          .insert({
            merchant_profile_id: merchantProfileId,
            policy_type: policyType,
            ...policy,
          });

        if (error) throw error;
      }

      toast({
        title: "Policy Saved",
        description: "Booking policy has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: "Error",
        description: "Failed to save policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold">{policyType === 'bus' ? 'Bus' : 'Event'} Booking Policy</h3>
      </div>

      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Configure cancellation and refund policies for {policyType} bookings. These rules will be automatically enforced.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-semibold">Refund Settings</h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Refund Window (hours before)</Label>
              <Input
                type="number"
                value={policy.partial_refund_window_hours}
                onChange={(e) => setPolicy({...policy, partial_refund_window_hours: parseInt(e.target.value)})}
                min={0}
              />
              <p className="text-xs text-muted-foreground">Cancel before this time for full refund</p>
            </div>

            <div className="space-y-2">
              <Label>Full Refund Percentage (%)</Label>
              <Input
                type="number"
                value={policy.full_refund_percentage}
                onChange={(e) => setPolicy({...policy, full_refund_percentage: parseFloat(e.target.value)})}
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label>No Refund Window (hours before)</Label>
              <Input
                type="number"
                value={policy.no_refund_window_hours}
                onChange={(e) => setPolicy({...policy, no_refund_window_hours: parseInt(e.target.value)})}
                min={0}
              />
              <p className="text-xs text-muted-foreground">No refund within this time</p>
            </div>

            <div className="space-y-2">
              <Label>Partial Refund Percentage (%)</Label>
              <Input
                type="number"
                value={policy.partial_refund_percentage}
                onChange={(e) => setPolicy({...policy, partial_refund_percentage: parseFloat(e.target.value)})}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">Between full and no refund windows</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Rescheduling Settings</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Rescheduling</Label>
              <p className="text-sm text-muted-foreground">Let customers reschedule bookings</p>
            </div>
            <Switch
              checked={policy.reschedule_allowed}
              onCheckedChange={(checked) => setPolicy({...policy, reschedule_allowed: checked})}
            />
          </div>

          {policy.reschedule_allowed && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Reschedule Fee ($)</Label>
                <Input
                  type="number"
                  value={policy.reschedule_fee}
                  onChange={(e) => setPolicy({...policy, reschedule_fee: parseFloat(e.target.value)})}
                  min={0}
                  step={0.01}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Reschedules Allowed</Label>
                <Input
                  type="number"
                  value={policy.max_reschedules}
                  onChange={(e) => setPolicy({...policy, max_reschedules: parseInt(e.target.value)})}
                  min={0}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Automated Enforcement</Label>
            <p className="text-sm text-muted-foreground">Automatically process eligible requests</p>
          </div>
          <Switch
            checked={policy.automated_enforcement}
            onCheckedChange={(checked) => setPolicy({...policy, automated_enforcement: checked})}
          />
        </div>

        <Button onClick={savePolicy} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Policy
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default BookingPolicyManager;
