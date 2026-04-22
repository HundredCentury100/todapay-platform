import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { getCurrentEmployeeAccount, getCorporateBookings, approveBooking, rejectBooking } from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee, CorporateBooking } from '@/types/corporate';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CorporateApprovals = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [employee, setEmployee] = useState<CorporateEmployee | null>(null);
  const [pendingBookings, setPendingBookings] = useState<CorporateBooking[]>([]);
  const [processedBookings, setProcessedBookings] = useState<CorporateBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CorporateBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/corporate/approvals'); return; }
    const load = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (!result || !result.employee.is_admin) { navigate('/corporate'); return; }
        setAccount(result.account);
        setEmployee(result.employee);
        const allBookings = await getCorporateBookings(result.account.id);
        setPendingBookings(allBookings.filter(b => b.approval_status === 'pending'));
        setProcessedBookings(allBookings.filter(b => b.approval_status !== 'pending').slice(0, 20));
      } catch (error) { console.error('Error loading approvals:', error); toast.error('Failed to load approvals'); }
      finally { setLoading(false); }
    };
    if (user) load();
  }, [user, authLoading, navigate]);

  const handleApprove = async (booking: CorporateBooking) => {
    if (!employee) return;
    setProcessing(true);
    try {
      const updated = await approveBooking(booking.id, employee.id);
      setPendingBookings(prev => prev.filter(b => b.id !== booking.id));
      setProcessedBookings(prev => [updated, ...prev]);
      toast.success('Booking approved');
    } catch { toast.error('Failed to approve booking'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!employee || !selectedBooking || !rejectionReason.trim()) return;
    setProcessing(true);
    try {
      const updated = await rejectBooking(selectedBooking.id, employee.id, rejectionReason);
      setPendingBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      setProcessedBookings(prev => [updated, ...prev]);
      setRejectDialogOpen(false); setRejectionReason(''); setSelectedBooking(null);
      toast.success('Booking rejected');
    } catch { toast.error('Failed to reject booking'); }
    finally { setProcessing(false); }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  if (!account || !employee) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">Booking Approvals</h1>
      <p className="text-muted-foreground mb-8">Review and manage pending travel requests</p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" />Pending Approvals ({pendingBookings.length})</CardTitle>
          <CardDescription>These bookings require your review</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>No pending approvals — you're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{booking.travel_purpose || 'Business Travel'}</p>
                      <p className="text-sm text-muted-foreground">Requested {format(new Date(booking.created_at), 'PPP')}</p>
                      {booking.project_code && <p className="text-xs text-muted-foreground">Project: {booking.project_code}</p>}
                      {booking.cost_center && <p className="text-xs text-muted-foreground">Cost Center: {booking.cost_center}</p>}
                      {booking.policy_violations && booking.policy_violations.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-xs text-amber-600 font-medium">{booking.policy_violations.length} policy violation(s)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedBooking(booking); setRejectDialogOpen(true); }} disabled={processing}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(booking)} disabled={processing}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                  {booking.policy_violations && booking.policy_violations.length > 0 && (
                    <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 rounded p-3 space-y-1">
                      {booking.policy_violations.map((v, i) => <p key={i} className="text-xs text-amber-700 dark:text-amber-400">• {v}</p>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Decisions</CardTitle>
          <CardDescription>Previously reviewed bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {processedBookings.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No history yet</p>
          ) : (
            <div className="space-y-3">
              {processedBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{booking.travel_purpose || 'Business Travel'}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(booking.created_at), 'PPP')}</p>
                  </div>
                  {booking.approval_status === 'approved' || booking.approval_status === 'auto_approved' ? (
                    <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this booking request.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
              {processing ? 'Rejecting...' : 'Reject Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorporateApprovals;
