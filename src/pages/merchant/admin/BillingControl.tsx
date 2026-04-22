import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings,
  Percent,
  Calendar,
  Bell,
  Save,
  Loader2,
} from "lucide-react";

const BillingControl = () => {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformFeePercentage: 5,
    billingCycleDay: 1,
    gracePeriodDays: 7,
    autoReminders: true,
    overdueNotifications: true,
    suspendOnOverdue: true,
    minPayoutThreshold: 100,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success("Billing settings saved");
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Billing Control</h1>
        <p className="text-sm text-muted-foreground">
          Configure platform billing and fee settings
        </p>
      </div>

      {/* Platform Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Platform Fees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fee">Default Platform Fee (%)</Label>
            <Input
              id="fee"
              type="number"
              value={settings.platformFeePercentage}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  platformFeePercentage: parseFloat(e.target.value) || 0,
                }))
              }
              min={0}
              max={100}
            />
            <p className="text-xs text-muted-foreground">
              Applied to all merchant transactions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Minimum Payout Threshold ($)</Label>
            <Input
              id="threshold"
              type="number"
              value={settings.minPayoutThreshold}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  minPayoutThreshold: parseFloat(e.target.value) || 0,
                }))
              }
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing Cycle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Billing Cycle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cycleDay">Billing Cycle Day</Label>
            <Input
              id="cycleDay"
              type="number"
              value={settings.billingCycleDay}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  billingCycleDay: parseInt(e.target.value) || 1,
                }))
              }
              min={1}
              max={28}
            />
            <p className="text-xs text-muted-foreground">
              Day of month when invoices are generated
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grace">Grace Period (Days)</Label>
            <Input
              id="grace"
              type="number"
              value={settings.gracePeriodDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  gracePeriodDays: parseInt(e.target.value) || 0,
                }))
              }
              min={0}
              max={30}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Auto Payment Reminders</p>
              <p className="text-xs text-muted-foreground">
                Send reminders before due date
              </p>
            </div>
            <Switch
              checked={settings.autoReminders}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, autoReminders: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Overdue Notifications</p>
              <p className="text-xs text-muted-foreground">
                Notify merchants when payment is overdue
              </p>
            </div>
            <Switch
              checked={settings.overdueNotifications}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  overdueNotifications: checked,
                }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Auto-Suspend Overdue</p>
              <p className="text-xs text-muted-foreground">
                Suspend merchant access after grace period
              </p>
            </div>
            <Switch
              checked={settings.suspendOnOverdue}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, suspendOnOverdue: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
};

export default BillingControl;
