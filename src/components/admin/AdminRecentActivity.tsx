import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X, Clock, Hash } from "lucide-react";
import { format } from "date-fns";
import { VERTICALS } from "./AdminVerticalGrid";

interface RecentBooking {
  id: string;
  booking_reference: string;
  item_name: string;
  passenger_name: string;
  total_price: number;
  status: string;
  payment_status: string;
  vertical: string | null;
  created_at: string;
  booking_type: string;
}

interface AdminRecentActivityProps {
  bookings: RecentBooking[];
  activeVertical: string | null;
  onClearFilter: () => void;
  formatCurrency: (amount: number) => string;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; icon: any; label: string }> = {
    pending: { variant: "secondary", icon: Clock, label: "Pending" },
    verified: { variant: "default", icon: Check, label: "Verified" },
    rejected: { variant: "destructive", icon: X, label: "Rejected" },
    confirmed: { variant: "default", icon: Check, label: "Confirmed" },
    cancelled: { variant: "destructive", icon: X, label: "Cancelled" },
  };
  const config = variants[status] || variants.pending;
  const Icon = config.icon;
  return <Badge variant={config.variant}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>;
};

const getPaymentBadge = (status: string) => {
  if (status === "paid") return <Badge variant="default">Paid</Badge>;
  if (status === "pending") return <Badge variant="secondary">Unpaid</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

export const AdminRecentActivity = ({
  bookings, activeVertical, onClearFilter, formatCurrency,
}: AdminRecentActivityProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Recent Activity {activeVertical && `— ${VERTICALS.find((v) => v.key === activeVertical)?.label}`}
            </CardTitle>
            <CardDescription className="text-xs">All service transactions with booking references</CardDescription>
          </div>
          {activeVertical && (
            <Button variant="outline" size="sm" onClick={onClearFilter}>Show All</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {bookings.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No bookings found</p>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3 px-4">
              {bookings.slice(0, 20).map((b) => (
                <Card key={b.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]" onClick={() => navigate(`/merchant/admin/booking/${b.id}`)}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{b.item_name}</p>
                      <p className="text-xs text-muted-foreground">{b.passenger_name}</p>
                    </div>
                    {getStatusBadge(b.status)}
                  </div>
                  <div className="flex items-center gap-2 my-1.5">
                    <Badge variant="outline" className="text-[10px]"><Hash className="h-3 w-3 mr-0.5" />{b.booking_reference}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{b.vertical || b.booking_type}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{formatCurrency(Number(b.total_price))}</span>
                    <div className="flex items-center gap-2">
                      {getPaymentBadge(b.payment_status)}
                      <span className="text-[10px] text-muted-foreground">{format(new Date(b.created_at), "dd MMM HH:mm")}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Txn #</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Vertical</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="cursor-pointer hover:bg-muted/80" onClick={() => navigate(`/merchant/admin/booking/${b.id}`)}>
                      <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{b.booking_reference}</code></TableCell>
                      <TableCell className="font-medium text-sm max-w-[180px] truncate">{b.item_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{b.vertical || b.booking_type}</Badge></TableCell>
                      <TableCell className="text-sm">{b.passenger_name}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(b.total_price))}</TableCell>
                      <TableCell>{getStatusBadge(b.status)}</TableCell>
                      <TableCell>{getPaymentBadge(b.payment_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(b.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
