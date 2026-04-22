import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, Users } from 'lucide-react';
import { getCurrentEmployeeAccount, getCorporateBookings, getEmployees } from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee, CorporateBooking } from '@/types/corporate';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CorporateReports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [employee, setEmployee] = useState<CorporateEmployee | null>(null);
  const [bookings, setBookings] = useState<CorporateBooking[]>([]);
  const [employees, setEmployees] = useState<CorporateEmployee[]>([]);
  const [bookingDetails, setBookingDetails] = useState<Record<string, { total_price: number; booking_type: string; travel_date: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('current');

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/corporate/reports'); return; }
    const load = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (!result || !result.employee.is_admin) { navigate('/corporate'); return; }
        setAccount(result.account); setEmployee(result.employee);

        const now = new Date();
        let start: Date, end: Date;
        if (period === 'current') { start = startOfMonth(now); end = endOfMonth(now); }
        else if (period === 'last') { start = startOfMonth(subMonths(now, 1)); end = endOfMonth(subMonths(now, 1)); }
        else { start = startOfMonth(subMonths(now, 2)); end = endOfMonth(now); }

        const [corpBookings, empList] = await Promise.all([
          getCorporateBookings(result.account.id, { startDate: start.toISOString(), endDate: end.toISOString() }),
          getEmployees(result.account.id),
        ]);
        setBookings(corpBookings); setEmployees(empList);

        const bookingIds = corpBookings.map(b => b.booking_id);
        if (bookingIds.length > 0) {
          const { data } = await supabase.from('bookings').select('id, total_price, booking_type, travel_date').in('id', bookingIds);
          if (data) {
            const map: Record<string, any> = {};
            data.forEach(d => { map[d.id] = { total_price: d.total_price, booking_type: d.booking_type, travel_date: d.travel_date }; });
            setBookingDetails(map);
          }
        }
      } catch (error) { console.error('Error:', error); toast.error('Failed to load report data'); }
      finally { setLoading(false); }
    };
    if (user) load();
  }, [user, authLoading, navigate, period]);

  const employeeMap = useMemo(() => {
    const m: Record<string, CorporateEmployee> = {};
    employees.forEach(e => { m[e.id] = e; });
    return m;
  }, [employees]);

  const spendByEmployee = useMemo(() => {
    const map: Record<string, { name: string; department: string; total: number; count: number }> = {};
    bookings.filter(b => b.approval_status === 'approved' || b.approval_status === 'auto_approved').forEach(b => {
      const emp = employeeMap[b.employee_id]; const detail = bookingDetails[b.booking_id]; const price = detail?.total_price || 0;
      if (!map[b.employee_id]) map[b.employee_id] = { name: emp?.employee_name || 'Unknown', department: emp?.department || 'N/A', total: 0, count: 0 };
      map[b.employee_id].total += price; map[b.employee_id].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [bookings, employeeMap, bookingDetails]);

  const spendByType = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.filter(b => b.approval_status === 'approved' || b.approval_status === 'auto_approved').forEach(b => {
      const detail = bookingDetails[b.booking_id]; const type = detail?.booking_type || 'other';
      map[type] = (map[type] || 0) + (detail?.total_price || 0);
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [bookings, bookingDetails]);

  const totalSpend = spendByEmployee.reduce((s, e) => s + e.total, 0);
  const totalBookings = bookings.length;
  const approvedCount = bookings.filter(b => b.approval_status === 'approved' || b.approval_status === 'auto_approved').length;
  const complianceRate = totalBookings > 0
    ? Math.round((bookings.filter(b => !b.policy_violations || b.policy_violations.length === 0).length / totalBookings) * 100)
    : 100;

  const exportCSV = () => {
    const rows = [['Employee', 'Department', 'Bookings', 'Total Spend']];
    spendByEmployee.forEach(e => rows.push([e.name, e.department, e.count.toString(), e.total.toFixed(2)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `corporate-report-${period}.csv`; a.click();
    URL.revokeObjectURL(url); toast.success('Report exported');
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }
  if (!account || !employee) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Spending Reports</h1>
          <p className="text-muted-foreground">Analyse corporate travel spend</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">This Month</SelectItem>
              <SelectItem value="last">Last Month</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Spend</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">R {totalSpend.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Bookings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalBookings}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Approved</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{approvedCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Policy Compliance</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{complianceRate}%</p></CardContent></Card>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Spend by Employee</CardTitle></CardHeader>
        <CardContent>
          {spendByEmployee.length === 0 ? <p className="text-center py-4 text-muted-foreground">No bookings in this period</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Bookings</TableHead><TableHead className="text-right">Total Spend</TableHead></TableRow></TableHeader>
              <TableBody>
                {spendByEmployee.map((e, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{e.name}</TableCell><TableCell>{e.department}</TableCell><TableCell className="text-right">{e.count}</TableCell><TableCell className="text-right">R {e.total.toLocaleString()}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Spend by Booking Type</CardTitle></CardHeader>
        <CardContent>
          {spendByType.length === 0 ? <p className="text-center py-4 text-muted-foreground">No bookings in this period</p> : (
            <div className="space-y-3">
              {spendByType.map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium capitalize">{type}</span>
                  <span className="font-bold">R {amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CorporateReports;
