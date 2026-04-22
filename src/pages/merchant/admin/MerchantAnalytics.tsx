import { useState, useEffect } from "react";
import { TrendingUp, Users, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { getAllMerchantProfiles } from "@/services/adminService";
import { getAllMerchantActivities } from "@/services/merchantActivityService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MerchantAnalytics = () => {
  const { isAdminUser, loading: adminLoading } = useAdmin();
  const [timeRange, setTimeRange] = useState("30");
  
  const { data: merchants, loading: merchantsLoading } = useDataFetching({
    fetchFn: getAllMerchantProfiles,
    errorMessage: "Failed to load merchants",
  });

  const { data: activities, loading: activitiesLoading } = useDataFetching({
    fetchFn: () => getAllMerchantActivities(100),
    errorMessage: "Failed to load activities",
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/merchant/admin/auth" replace />;
  }

  const loading = merchantsLoading || activitiesLoading;

  // Calculate metrics
  const totalMerchants = merchants?.length || 0;
  const verifiedMerchants = merchants?.filter(m => m.verification_status === 'verified').length || 0;
  const pendingMerchants = merchants?.filter(m => m.verification_status === 'pending').length || 0;
  const rejectedMerchants = merchants?.filter(m => m.verification_status === 'rejected').length || 0;

  // Status distribution for pie chart
  const statusData = [
    { name: 'Verified', value: verifiedMerchants, color: '#10b981' },
    { name: 'Pending', value: pendingMerchants, color: '#f59e0b' },
    { name: 'Rejected', value: rejectedMerchants, color: '#ef4444' },
  ];

  // Role distribution
  const busOperators = merchants?.filter(m => m.role === 'bus_operator').length || 0;
  const eventOrganizers = merchants?.filter(m => m.role === 'event_organizer').length || 0;

  const roleData = [
    { name: 'Bus Operators', value: busOperators },
    { name: 'Event Organizers', value: eventOrganizers },
  ];

  // Registration trends (last 30 days)
  const getRegistrationTrends = () => {
    const days = parseInt(timeRange);
    const trends: { [key: string]: number } = {};
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trends[dateStr] = 0;
    }

    merchants?.forEach(merchant => {
      const createdDate = new Date(merchant.created_at).toISOString().split('T')[0];
      if (trends.hasOwnProperty(createdDate)) {
        trends[createdDate]++;
      }
    });

    return Object.entries(trends).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      registrations: count,
    }));
  };

  const registrationTrends = getRegistrationTrends();

  // Recent activity summary
  const recentApprovals = activities?.filter(a => 
    a.activity_type === 'account_approved' && 
    new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length || 0;

  const recentRejections = activities?.filter(a => 
    a.activity_type === 'account_rejected' && 
    new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length || 0;

  const approvalRate = totalMerchants > 0 
    ? ((verifiedMerchants / totalMerchants) * 100).toFixed(1) 
    : "0";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Merchant Analytics</h1>
              <p className="text-muted-foreground">Track merchant growth and verification trends</p>
            </div>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMerchants}</div>
                  <p className="text-xs text-muted-foreground">
                    {busOperators} bus operators, {eventOrganizers} event organizers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{verifiedMerchants}</div>
                  <p className="text-xs text-muted-foreground">
                    {approvalRate}% approval rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingMerchants}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting verification
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentApprovals + recentRejections}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 7 days: {recentApprovals} approved, {recentRejections} rejected
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Registration Trends</CardTitle>
                  <CardDescription>New merchant registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={registrationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                  <CardDescription>Distribution of merchant verification status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Merchant Types</CardTitle>
                  <CardDescription>Distribution by business type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Approval Rate</span>
                    <span className="text-2xl font-bold text-green-600">{approvalRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending Queue</span>
                    <span className="text-2xl font-bold text-yellow-600">{pendingMerchants}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Rejection Rate</span>
                    <span className="text-2xl font-bold text-red-600">
                      {totalMerchants > 0 ? ((rejectedMerchants / totalMerchants) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg. Processing Time</span>
                    <span className="text-2xl font-bold">2.5d</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MerchantAnalytics;