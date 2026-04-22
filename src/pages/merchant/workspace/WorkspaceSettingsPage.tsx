import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Laptop, Bell, Shield, Clock, CreditCard, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WorkspaceSettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    businessAddress: "",
    timezone: "Africa/Johannesburg",
    // Booking policies
    minBookingDuration: "1",
    maxAdvanceBookingDays: "30",
    cancellationHours: "24",
    autoConfirmBookings: true,
    allowSameDayBookings: true,
    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    bookingAlerts: true,
    paymentAlerts: true,
    reviewAlerts: true,
    // Equipment
    defaultEquipmentIncluded: "",
    cleaningFee: "0",
    securityDeposit: "0",
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your workspace settings have been updated successfully.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace provider settings</p>
      </div>

      <div className="grid gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Update your business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input 
                id="business-name" 
                placeholder="Enter business name"
                value={settings.businessName}
                onChange={(e) => setSettings(s => ({ ...s, businessName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input 
                id="contact-email" 
                type="email" 
                placeholder="Enter contact email"
                value={settings.contactEmail}
                onChange={(e) => setSettings(s => ({ ...s, contactEmail: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input 
                id="contact-phone" 
                placeholder="Enter contact phone"
                value={settings.contactPhone}
                onChange={(e) => setSettings(s => ({ ...s, contactPhone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-address">Business Address</Label>
              <Textarea 
                id="business-address" 
                placeholder="Enter business address"
                value={settings.businessAddress}
                onChange={(e) => setSettings(s => ({ ...s, businessAddress: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(v) => setSettings(s => ({ ...s, timezone: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Harare">Africa/Harare (CAT)</SelectItem>
                  <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                  <SelectItem value="Africa/Lusaka">Africa/Lusaka (CAT)</SelectItem>
                  <SelectItem value="Africa/Maputo">Africa/Maputo (CAT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Booking Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Booking Policies
            </CardTitle>
            <CardDescription>Configure booking rules and policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min-duration">Minimum Booking Duration (hours)</Label>
                <Input 
                  id="min-duration" 
                  type="number" 
                  min="1"
                  value={settings.minBookingDuration}
                  onChange={(e) => setSettings(s => ({ ...s, minBookingDuration: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-advance">Max Advance Booking (days)</Label>
                <Input 
                  id="max-advance" 
                  type="number" 
                  min="1"
                  value={settings.maxAdvanceBookingDays}
                  onChange={(e) => setSettings(s => ({ ...s, maxAdvanceBookingDays: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cancellation">Cancellation Window (hours before)</Label>
              <Input 
                id="cancellation" 
                type="number" 
                min="0"
                value={settings.cancellationHours}
                onChange={(e) => setSettings(s => ({ ...s, cancellationHours: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Guests can cancel for free up to this many hours before their booking starts
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-confirm Bookings</Label>
                <p className="text-xs text-muted-foreground">Automatically confirm new bookings</p>
              </div>
              <Switch 
                checked={settings.autoConfirmBookings}
                onCheckedChange={(v) => setSettings(s => ({ ...s, autoConfirmBookings: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Same-day Bookings</Label>
                <p className="text-xs text-muted-foreground">Allow guests to book for the current day</p>
              </div>
              <Switch 
                checked={settings.allowSameDayBookings}
                onCheckedChange={(v) => setSettings(s => ({ ...s, allowSameDayBookings: v }))}
              />
            </div>
            <Button onClick={handleSave}>Save Policies</Button>
          </CardContent>
        </Card>

        {/* Fees & Deposits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Fees & Deposits
            </CardTitle>
            <CardDescription>Configure additional fees and deposits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cleaning-fee">Cleaning Fee (per booking)</Label>
                <Input 
                  id="cleaning-fee" 
                  type="number" 
                  min="0"
                  value={settings.cleaningFee}
                  onChange={(e) => setSettings(s => ({ ...s, cleaningFee: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="security-deposit">Security Deposit</Label>
                <Input 
                  id="security-deposit" 
                  type="number" 
                  min="0"
                  value={settings.securityDeposit}
                  onChange={(e) => setSettings(s => ({ ...s, securityDeposit: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="default-equipment">Default Equipment Included</Label>
              <Textarea 
                id="default-equipment" 
                placeholder="List equipment included with all bookings (one per line)"
                value={settings.defaultEquipmentIncluded}
                onChange={(e) => setSettings(s => ({ ...s, defaultEquipmentIncluded: e.target.value }))}
              />
            </div>
            <Button onClick={handleSave}>Save Fees</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch 
                checked={settings.emailNotifications}
                onCheckedChange={(v) => setSettings(s => ({ ...s, emailNotifications: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via SMS</p>
              </div>
              <Switch 
                checked={settings.smsNotifications}
                onCheckedChange={(v) => setSettings(s => ({ ...s, smsNotifications: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>New Booking Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified of new bookings</p>
              </div>
              <Switch 
                checked={settings.bookingAlerts}
                onCheckedChange={(v) => setSettings(s => ({ ...s, bookingAlerts: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Payment Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified of payments</p>
              </div>
              <Switch 
                checked={settings.paymentAlerts}
                onCheckedChange={(v) => setSettings(s => ({ ...s, paymentAlerts: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Review Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified of new reviews</p>
              </div>
              <Switch 
                checked={settings.reviewAlerts}
                onCheckedChange={(v) => setSettings(s => ({ ...s, reviewAlerts: v }))}
              />
            </div>
            <Button onClick={handleSave}>Save Notifications</Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <Button variant="outline">Enable Two-Factor Authentication</Button>
            <Button variant="outline">View Login History</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkspaceSettingsPage;