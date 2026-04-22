import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Bell, Shield } from "lucide-react";

const AirlineSettingsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your airline partner settings</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Airline Information
            </CardTitle>
            <CardDescription>Update your airline details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="airline-name">Airline Name</Label>
              <Input id="airline-name" placeholder="Enter airline name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="airline-code">Airline Code</Label>
              <Input id="airline-code" placeholder="e.g., AA, BA, LH" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input id="contact-email" type="email" placeholder="Enter contact email" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Notification settings coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AirlineSettingsPage;