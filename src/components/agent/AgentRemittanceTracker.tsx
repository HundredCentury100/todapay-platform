import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, DollarSign, Upload } from "lucide-react";
import { agentRemittanceService } from "@/services/agentRemittanceService";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface AgentRemittanceTrackerProps {
  agentProfileId: string;
}

export const AgentRemittanceTracker = ({ agentProfileId }: AgentRemittanceTrackerProps) => {
  const { convertPrice } = useCurrency();

  const { data: pendingRemittances = [], isLoading } = useQuery({
    queryKey: ['pending-remittances', agentProfileId],
    queryFn: () => agentRemittanceService.getPendingRemittances(agentProfileId),
    enabled: !!agentProfileId,
  });

  const { data: summary } = useQuery({
    queryKey: ['remittance-summary', agentProfileId],
    queryFn: () => agentRemittanceService.getRemittanceSummary(agentProfileId),
    enabled: !!agentProfileId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Remittances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {convertPrice(summary?.totalPending || 0)}
            </div>
            {summary && summary.overdueCount > 0 && (
              <p className="text-xs text-destructive mt-1">
                {summary.overdueCount} overdue
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {convertPrice(summary?.totalVerified || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {convertPrice(summary?.totalCompleted || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {summary && summary.overdueCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {summary.overdueCount} overdue remittance{summary.overdueCount > 1 ? 's' : ''}. 
            Please process them as soon as possible to avoid account restrictions.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Remittances Table */}
      {pendingRemittances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Remittances</CardTitle>
            <CardDescription>
              Payments you need to send to merchants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount to Remit</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRemittances.map((remittance: any) => {
                  const isOverdue = remittance.due_date && new Date(remittance.due_date) < new Date();
                  
                  return (
                    <TableRow key={remittance.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-mono text-sm">
                        {remittance.bookings?.booking_reference || 'N/A'}
                      </TableCell>
                      <TableCell>{remittance.bookings?.passenger_name || 'N/A'}</TableCell>
                      <TableCell>{remittance.bookings?.item_name || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">
                        {convertPrice(remittance.amount)}
                      </TableCell>
                      <TableCell>
                        {remittance.due_date ? (
                          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                            {format(new Date(remittance.due_date), 'MMM dd, yyyy')}
                          </span>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                          {isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Upload className="w-3 h-3 mr-1" />
                          Upload Proof
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pendingRemittances.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No pending remittances
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
