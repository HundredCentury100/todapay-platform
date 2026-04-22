import { useQuery } from "@tanstack/react-query";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, DollarSign, TrendingUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function SubAgentsPage() {
  const { merchantProfile } = useMerchantAuth();

  const { data: subAgents = [] } = useQuery({
    queryKey: ['sub-agents', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('agent_referrals')
        .select(`
          id,
          created_at,
          merchant_profiles!agent_referrals_referred_agent_id_fkey (
            id,
            business_name,
            business_email,
            agent_tier,
            commission_rate,
            created_at
          )
        `)
        .eq('referrer_agent_id', merchantProfile.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const { data: overrideCommissions = [] } = useQuery({
    queryKey: ['override-commissions', merchantProfile?.id],
    queryFn: async () => {
      if (!merchantProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('agent_override_commissions')
        .select('*')
        .eq('referrer_agent_id', merchantProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!merchantProfile?.id,
  });

  const totalOverrideEarnings = overrideCommissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.override_amount), 0);

  const pendingOverrideEarnings = overrideCommissions
    .filter(c => c.status === 'approved' || c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.override_amount), 0);

  const copyReferralCode = () => {
    if (merchantProfile?.referral_code) {
      navigator.clipboard.writeText(merchantProfile.referral_code);
      toast.success("Referral code copied to clipboard");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Sub-Agents</h1>
        <p className="text-muted-foreground mt-1">
          Manage your recruited agents and track override commissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sub-Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subAgents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recruited agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Override Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {totalOverrideEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Override</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {pendingOverrideEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>
            Share this code to recruit new sub-agents and earn 2% override commission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <div className="flex-1 p-4 bg-muted rounded-lg font-mono text-2xl font-bold">
              {merchantProfile?.referral_code || 'N/A'}
            </div>
            <Button onClick={copyReferralCode} variant="outline" size="lg">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <Alert className="mt-4">
            <AlertDescription>
              You earn 2% override commission on all bookings made by agents who sign up with your referral code. 
              This is in addition to your regular commissions on your own bookings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Sub-Agents</CardTitle>
          <CardDescription>
            Agents recruited using your referral code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sub-agents yet. Share your referral code to start recruiting!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subAgents.map((referral: any) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">
                      {referral.merchant_profiles.business_name}
                    </TableCell>
                    <TableCell>{referral.merchant_profiles.business_email}</TableCell>
                    <TableCell>
                      <Badge className="capitalize">
                        {referral.merchant_profiles.agent_tier || 'standard'}
                      </Badge>
                    </TableCell>
                    <TableCell>{referral.merchant_profiles.commission_rate || 10}%</TableCell>
                    <TableCell>
                      {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {overrideCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Override Commission History</CardTitle>
            <CardDescription>
              2% earnings from sub-agent bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Override Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrideCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>{format(new Date(commission.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-mono text-sm">{commission.booking_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">R {Number(commission.override_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        commission.status === 'paid' ? 'default' :
                        commission.status === 'approved' ? 'secondary' :
                        'outline'
                      }>
                        {commission.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
