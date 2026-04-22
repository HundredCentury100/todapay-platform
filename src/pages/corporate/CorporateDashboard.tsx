import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, Users, FileText, Receipt, TrendingUp, Clock, 
  CheckCircle, XCircle, AlertTriangle, Plus, Settings, Link2
} from 'lucide-react';
import { getCurrentEmployeeAccount, getCorporateDashboardStats, getCorporateBookings } from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee, CorporateBooking } from '@/types/corporate';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { OnboardingChecklist } from '@/components/merchant/OnboardingChecklist';

const CorporateDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [employee, setEmployee] = useState<CorporateEmployee | null>(null);
  const [stats, setStats] = useState({
    activeEmployees: 0,
    monthlyBookings: 0,
    totalSpentThisMonth: 0,
    pendingApprovals: 0
  });
  const [recentBookings, setRecentBookings] = useState<CorporateBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/corporate');
      return;
    }

    const loadData = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (!result) {
          navigate('/corporate/register');
          return;
        }

        setAccount(result.account);
        setEmployee(result.employee);

        const [dashboardStats, bookings] = await Promise.all([
          getCorporateDashboardStats(result.account.id),
          getCorporateBookings(result.account.id)
        ]);

        setStats(dashboardStats);
        setRecentBookings(bookings.slice(0, 5));
      } catch (error) {
        console.error('Error loading corporate data:', error);
        toast.error('Failed to load corporate account');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!account || !employee) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'auto_approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{account.company_name}</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Corporate Travel Portal</p>
            {account.account_number && (
              <span className="text-xs font-mono px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                {account.account_number}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Badge variant={account.account_status === 'active' ? 'default' : 'secondary'}>
            {account.account_status.toUpperCase()}
          </Badge>
          <Button onClick={() => navigate('/')}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist
        merchantProfileId={account.id}
        verificationStatus={account.account_status}
        role="corporate"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Registered travelers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Bookings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyBookings}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R {stats.totalSpentThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
          {employee.is_admin && <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Your company's latest travel bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings yet</p>
                  <Button variant="link" onClick={() => navigate('/')}>
                    Make your first booking
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.travel_purpose || 'Business Travel'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.created_at), 'PPP')}
                        </p>
                        {booking.project_code && (
                          <p className="text-xs text-muted-foreground">
                            Project: {booking.project_code}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(booking.approval_status)}
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => navigate('/corporate/bookings')}>
                    View All Bookings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {employee.is_admin && (
          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Bookings requiring your approval</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.pendingApprovals === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => navigate('/corporate/approvals')}>
                    Review {stats.pendingApprovals} Pending Bookings
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Billing and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/corporate/invoices')}>
                View All Invoices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      {employee.is_admin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/corporate/employees')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Employees
              </CardTitle>
              <CardDescription>Add or edit employee access</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/corporate/policies')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Travel Policies
              </CardTitle>
              <CardDescription>Configure travel rules and limits</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/corporate/reports')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Reports
              </CardTitle>
              <CardDescription>View spending analytics</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/corporate/booking-links')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Share Events
              </CardTitle>
              <CardDescription>Generate booking links for employees</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CorporateDashboard;
