import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AgentSettingsPage() {
  const { merchantProfile } = useMerchantAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your agent profile and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
            <CardDescription>Your agent profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={merchantProfile?.business_name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Agent Code</Label>
              <Input value={merchantProfile?.agent_code || 'Pending'} disabled className="font-mono font-bold" />
            </div>
            <div className="space-y-2">
              <Label>Agent Type</Label>
              <Badge 
                variant="outline"
                className={merchantProfile?.role === 'travel_agent' ? 'border-primary text-primary' : 'border-orange-500 text-orange-600'}
              >
                {merchantProfile?.role === 'travel_agent' ? 'Internal' : 'External'}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={merchantProfile?.agent_license_number || 'N/A'} disabled />
            </div>
            <div className="space-y-2">
              <Label>Agent Tier</Label>
              <Badge className="capitalize">{merchantProfile?.agent_tier || 'standard'}</Badge>
            </div>
            <div className="space-y-2">
              <Label>Commission Rate</Label>
              <Input value={`${merchantProfile?.commission_rate || 10}%`} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral Code</CardTitle>
            <CardDescription>Share this code to recruit sub-agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Referral Code</Label>
              <div className="flex gap-2">
                <Input 
                  value={merchantProfile?.referral_code || 'N/A'} 
                  disabled 
                  className="font-mono"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Share this code with potential sub-agents to earn override commissions on their bookings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How clients can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Email</Label>
              <Input value={merchantProfile?.business_email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Business Phone</Label>
              <Input value={merchantProfile?.business_phone || 'N/A'} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Business Address</Label>
            <Input value={merchantProfile?.business_address || 'N/A'} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
