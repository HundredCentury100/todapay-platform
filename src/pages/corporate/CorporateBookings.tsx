import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Plus, Calendar, DollarSign } from 'lucide-react';
import { getCurrentEmployeeAccount, getCorporateBookings } from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee, CorporateBooking } from '@/types/corporate';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

const CorporateBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { convertPrice } = useCurrency();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [employee, setEmployee] = useState<CorporateEmployee | null>(null);
  const [bookings, setBookings] = useState<CorporateBooking[]>([]);
  const [bookingDetails, setBookingDetails] = useState<Record<string, any>>({});
  const [employees, setEmployees] = useState<Record<string, CorporateEmployee>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/corporate/bookings');
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

        const [corpBookings, empData] = await Promise.all([
          getCorporateBookings(result.account.id, statusFilter !== 'all' ? { status: statusFilter } : undefined),
          supabase.from('corporate_employees').select('*').eq('corporate_account_id', result.account.id),
        ]);

        setBookings(corpBookings);

        // Build employee map
        if (empData.data) {
          const map: Record<string, CorporateEmployee> = {};
          empData.data.forEach((e: any) => { map[e.id] = e as CorporateEmployee; });
          setEmployees(map);
        }

        // Fetch booking details
        const bookingIds = corpBookings.map(b => b.booking_id);
        if (bookingIds.length > 0) {
          const { data } = await supabase
            .from('bookings')
            .select('id, item_name, total_price, booking_type, travel_date, status, booking_reference, passenger_name')
            .in('id', bookingIds);
          if (data) {
            const map: Record<string, any> = {};
            data.forEach(d => { map[d.id] = d; });
            setBookingDetails(map);
          }
        }
      } catch (error) {
        console.error('Error loading bookings:', error);
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user, authLoading, navigate, statusFilter]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved' },
      auto_approved: { className: 'bg-green-100 text-green-800', label: 'Auto-Approved' },
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    const m = map[status] || { className: '', label: status };
    return <Badge className={m.className}>{m.label}</Badge>;
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const detail = bookingDetails[b.booking_id];
    const empName = employees[b.employee_id]?.employee_name || '';
    const search = searchQuery.toLowerCase();
    return (
      empName.toLowerCase().includes(search) ||
      (detail?.item_name || '').toLowerCase().includes(search) ||
      (detail?.booking_reference || '').toLowerCase().includes(search) ||
      (b.project_code || '').toLowerCase().includes(search)
    );
  });

  const totalSpend = filteredBookings
    .filter(b => b.approval_status === 'approved' || b.approval_status === 'auto_approved')
    .reduce((sum, b) => sum + (bookingDetails[b.booking_id]?.total_price || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Bookings</h1>
          <p className="text-muted-foreground">View and manage corporate travel bookings</p>
        </div>
        <Button onClick={() => navigate('/')}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" /> Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{filteredBookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Spend (Approved)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{convertPrice(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {filteredBookings.filter(b => b.approval_status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee, booking, or project code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found</p>
              <Button variant="link" onClick={() => navigate('/')}>
                Make a booking
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const detail = bookingDetails[booking.booking_id];
                  const emp = employees[booking.employee_id];
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {detail?.booking_reference || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{emp?.employee_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{emp?.department || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{detail?.item_name || '-'}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {detail?.booking_type || '-'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{booking.travel_purpose || '-'}</TableCell>
                      <TableCell className="text-sm font-mono">{booking.project_code || '-'}</TableCell>
                      <TableCell className="font-semibold">
                        {detail?.total_price ? convertPrice(detail.total_price) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.approval_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateBookings;
