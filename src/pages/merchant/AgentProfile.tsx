import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileAppLayout from "@/components/MobileAppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/ui/loading-states";
import { 
  Plane, Users, TrendingUp, Settings,
  ChevronRight, DollarSign, Award, Target, Star,
  CheckCircle, UserPlus, ClipboardList, Share2, Copy
} from "lucide-react";
import { toast } from "sonner";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";

const AgentProfile = () => {
  const navigate = useNavigate();
  const { merchantProfile, loading: authLoading } = useMerchantAuth();

  const copyReferralCode = () => {
    if (merchantProfile?.referral_code) {
      navigator.clipboard.writeText(merchantProfile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  if (authLoading) {
    return (
      <MobileAppLayout>
        <PageLoader message="Loading agent profile..." />
      </MobileAppLayout>
    );
  }

  if (!merchantProfile || !['travel_agent', 'booking_agent'].includes(merchantProfile.role)) {
    return (
      <MobileAppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="text-center py-12">
              <Plane className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Not an Agent Yet</h2>
              <p className="text-muted-foreground mb-4">
                Register as a travel or booking agent to access this page.
              </p>
              <Button onClick={() => navigate('/merchant/auth')}>
                Become an Agent
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileAppLayout>
    );
  }

  const agentStats = {
    totalBookings: 124,
    thisMonthBookings: 18,
    totalCommission: 45600,
    pendingCommission: 3200,
    clientCount: 67,
    conversionRate: 72,
    tier: 'Gold',
    tierProgress: 75,
    referrals: 5,
  };

  const tierColors = {
    Bronze: 'from-amber-700 to-amber-900',
    Silver: 'from-slate-400 to-slate-600',
    Gold: 'from-yellow-400 to-amber-500',
    Platinum: 'from-purple-500 to-indigo-600',
  };

  return (
    <MobileAppLayout>
      <div className="min-h-screen bg-background pb-6">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 text-white px-4 pt-6 pb-20">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plane className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{merchantProfile.business_name}</h1>
              <p className="text-sm opacity-80">
                {merchantProfile.role === 'travel_agent' ? 'Internal Agent' : 'External Agent'}
                {merchantProfile.agent_code && (
                  <span className="ml-2 font-mono bg-white/20 px-2 py-0.5 rounded text-xs">{merchantProfile.agent_code}</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  className={`bg-gradient-to-r ${tierColors[agentStats.tier as keyof typeof tierColors]} text-white border-0`}
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {agentStats.tier} Agent
                </Badge>
                {merchantProfile.verification_status === 'verified' && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="opacity-80">Progress to Platinum</span>
              <span className="font-medium">{agentStats.tierProgress}%</span>
            </div>
            <Progress value={agentStats.tierProgress} className="h-2 bg-white/20" />
          </div>

          {merchantProfile.referral_code && (
            <div className="mt-4 p-3 rounded-xl bg-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70">Your Referral Code</p>
                <p className="font-mono font-bold text-lg">{merchantProfile.referral_code}</p>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white/20 hover:bg-white/30 text-white"
                onClick={copyReferralCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="px-4 -mt-12 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-5 w-5 text-teal-600" />
                </div>
                <p className="text-2xl font-bold">R{agentStats.totalCommission.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{agentStats.totalBookings}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{agentStats.clientCount}</p>
                <p className="text-xs text-muted-foreground">Clients</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{agentStats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <Tabs defaultValue="earnings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="earnings" className="gap-1 text-xs">
                <DollarSign className="h-4 w-4" />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-1 text-xs">
                <Share2 className="h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1 text-xs">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="earnings" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Commission Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Payout</p>
                      <p className="text-xl font-bold text-green-600">
                        R{agentStats.pendingCommission.toLocaleString()}
                      </p>
                    </div>
                    <Button size="sm">Request Payout</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">This Month</p>
                      <p className="text-lg font-bold">{agentStats.thisMonthBookings} bookings</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Commission Rate</p>
                      <p className="text-lg font-bold">{merchantProfile.commission_rate || 10}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Recent Commissions</CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Commission history will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4 mt-4">
              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-8 w-8 text-teal-600" />
                  </div>
                  <p className="text-3xl font-bold text-teal-700 dark:text-teal-400">
                    {agentStats.referrals}
                  </p>
                  <p className="text-sm text-teal-600 dark:text-teal-500">Agents Referred</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Earn override commissions on their bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Grow Your Network</p>
                      <p className="text-xs text-muted-foreground">
                        Invite agents and earn 2% on all their bookings
                      </p>
                    </div>
                    <Button size="sm">Invite</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    My Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => navigate('/merchant/agent/clients')}
                  >
                    <span>Manage {agentStats.clientCount} Clients</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input value={merchantProfile.business_name} className="h-12" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={merchantProfile.business_email} className="h-12" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission Rate</Label>
                    <Input value={`${merchantProfile.commission_rate || 10}%`} className="h-12" readOnly />
                  </div>
                  <Button className="w-full h-12">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileAppLayout>
  );
};

export default AgentProfile;
