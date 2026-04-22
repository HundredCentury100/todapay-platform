import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BookingActionsPage = () => {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingNote, setProcessingNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadActions();
  }, [filterStatus]);

  const loadActions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('booking_actions')
        .select(`
          *,
          bookings (
            booking_reference,
            passenger_name,
            item_name,
            total_price,
            event_date,
            travel_date,
            booking_type
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('action_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Error loading actions:', error);
      toast({
        title: "Error",
        description: "Failed to load booking actions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAction = async (actionId: string, status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('booking_actions')
        .update({
          action_status: status,
          notes: processingNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', actionId);

      if (error) throw error;

      toast({
        title: "Action Processed",
        description: `Booking action ${status}`,
      });

      setDialogOpen(false);
      setProcessingNote("");
      loadActions();
    } catch (error) {
      console.error('Error processing action:', error);
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'completed':
        return <Badge>Completed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'cancel':
        return <Badge variant="outline" className="border-red-300">Cancellation</Badge>;
      case 'refund':
        return <Badge variant="outline" className="border-green-300">Refund</Badge>;
      case 'reschedule':
        return <Badge variant="outline" className="border-blue-300">Reschedule</Badge>;
      case 'upgrade':
        return <Badge variant="outline" className="border-purple-300">Upgrade</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const pendingCount = actions.filter(a => a.action_status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking Actions</h1>
          <p className="text-muted-foreground">Manage cancellations, refunds, and reschedule requests</p>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="mt-2">
              {pendingCount} Pending Actions
            </Badge>
          )}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action Type</TableHead>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Refund Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No booking actions found
                    </TableCell>
                  </TableRow>
                ) : (
                  actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>{getActionBadge(action.action_type)}</TableCell>
                      <TableCell className="font-mono">{action.bookings?.booking_reference}</TableCell>
                      <TableCell>{action.bookings?.passenger_name}</TableCell>
                      <TableCell>{action.bookings?.item_name}</TableCell>
                      <TableCell>
                        {action.refund_amount ? `$${action.refund_amount} (${action.refund_percentage}%)` : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(action.action_status)}</TableCell>
                      <TableCell>{new Date(action.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAction(action);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Action Details</DialogTitle>
          </DialogHeader>
          
          {selectedAction && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Action Type</p>
                  <p className="font-semibold">{getActionBadge(selectedAction.action_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold">{getStatusBadge(selectedAction.action_status)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Reference</p>
                  <p className="font-mono">{selectedAction.bookings?.booking_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p>{selectedAction.bookings?.passenger_name}</p>
                </div>
                {selectedAction.refund_amount && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Refund Amount</p>
                      <p className="font-semibold text-green-600">${selectedAction.refund_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Refund Percentage</p>
                      <p>{selectedAction.refund_percentage}%</p>
                    </div>
                  </>
                )}
              </div>

              {selectedAction.reason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer Reason</p>
                  <p className="text-sm bg-muted p-3 rounded">{selectedAction.reason}</p>
                </div>
              )}

              {selectedAction.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Processing Notes</p>
                  <p className="text-sm bg-muted p-3 rounded">{selectedAction.notes}</p>
                </div>
              )}

              {selectedAction.action_status === 'pending' && (
                <>
                  <div className="space-y-2">
                    <Label>Add Processing Notes</Label>
                    <Textarea
                      value={processingNote}
                      onChange={(e) => setProcessingNote(e.target.value)}
                      placeholder="Add notes for this decision..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleProcessAction(selectedAction.id, 'approved')}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleProcessAction(selectedAction.id, 'rejected')}
                      disabled={processing}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingActionsPage;
