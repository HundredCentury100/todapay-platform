import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMerchantAuth } from "@/hooks/useMerchantAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DollarSign, TrendingUp, Clock, ChevronDown, Loader2, Wallet } from "lucide-react";
import StatCard from "@/components/merchant/StatCard";

interface Payout {
  id: string;
  amount: number;
  fee_deducted: number | null;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
  payout_method: string;
  payout_reference: string | null;
  created_at: string | null;
  processed_at: string | null;
  notes: string | null;
}

interface PayoutItem {
  id: string;
  payout_id: string;
  transaction_id: string | null;
  amount: number;
}

export default function PayoutsPage() {
  const { merchantProfile } = useMerchantAuth();
  const { convertPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);
  const [payoutItems, setPayoutItems] = useState<Record<string, PayoutItem[]>>({});
  const [estimatedPayout, setEstimatedPayout] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalFees, setTotalFees] = useState(0);

  useEffect(() => {
    if (merchantProfile) {
      loadPayouts();
      loadEstimatedPayout();
    }
  }, [merchantProfile]);

  const loadPayouts = async () => {
    if (!merchantProfile) return;
    try {
      const { data, error } = await supabase
        .from('merchant_payouts')
        .select('*')
        .eq('merchant_profile_id', merchantProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const payoutsData = (data || []) as Payout[];
      setPayouts(payoutsData);

      const paid = payoutsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const fees = payoutsData.reduce((sum, p) => sum + Number(p.fee_deducted || 0), 0);
      setTotalPaid(paid);
      setTotalFees(fees);
    } catch (error) {
      console.error("Error loading payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstimatedPayout = async () => {
    if (!merchantProfile) return;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const { data } = await supabase
      .from('transactions')
      .select('merchant_amount')
      .eq('merchant_profile_id', merchantProfile.id)
      .eq('payment_status', 'completed')
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());

    const total = (data || []).reduce((sum, t) => sum + Number(t.merchant_amount), 0);
    setEstimatedPayout(total);
  };

  const loadPayoutItems = async (payoutId: string) => {
    if (payoutItems[payoutId]) return;
    const { data } = await supabase
      .from('payout_items')
      .select('*')
      .eq('payout_id', payoutId);
    setPayoutItems(prev => ({ ...prev, [payoutId]: (data || []) as PayoutItem[] }));
  };

  const togglePayout = (payoutId: string) => {
    if (expandedPayout === payoutId) {
      setExpandedPayout(null);
    } else {
      setExpandedPayout(payoutId);
      loadPayoutItems(payoutId);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing': return <Badge className="bg-blue-500">Processing</Badge>;
      case 'pending': return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Payouts</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Payouts are processed every Wednesday. Funds are held for 7 days to allow for chargebacks.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Estimated This Week"
          value={convertPrice(estimatedPayout)}
          icon={Clock}
        />
        <StatCard
          title="Total Paid Out"
          value={convertPrice(totalPaid)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Fees Deducted"
          value={convertPrice(totalFees)}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Payouts"
          value={String(payouts.length)}
          icon={Wallet}
        />
      </div>

      {/* Upcoming Payout */}
      {estimatedPayout > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Upcoming Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{convertPrice(estimatedPayout)}</p>
                <p className="text-sm text-muted-foreground">
                  Estimated for {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </p>
              </div>
              <Badge variant="outline" className="border-primary text-primary">
                10% platform fee deducted
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No payouts yet. Payouts are processed every Wednesday.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map(payout => (
                <Collapsible
                  key={payout.id}
                  open={expandedPayout === payout.id}
                  onOpenChange={() => togglePayout(payout.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4 text-left">
                        <div>
                          <p className="font-semibold">{convertPrice(payout.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {payout.period_start && payout.period_end
                              ? `${format(new Date(payout.period_start), 'MMM d')} - ${format(new Date(payout.period_end), 'MMM d, yyyy')}`
                              : payout.created_at ? format(new Date(payout.created_at), 'MMM d, yyyy') : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fee: {convertPrice(payout.fee_deducted || 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payout.status)}
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedPayout === payout.id ? 'rotate-180' : ''}`} />
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Method:</span>{' '}
                          <span className="capitalize">{payout.payout_method.replace('_', ' ')}</span>
                        </div>
                        {payout.payout_reference && (
                          <div>
                            <span className="text-muted-foreground">Reference:</span>{' '}
                            <span className="font-mono">{payout.payout_reference}</span>
                          </div>
                        )}
                        {payout.processed_at && (
                          <div>
                            <span className="text-muted-foreground">Processed:</span>{' '}
                            <span>{format(new Date(payout.processed_at), 'PPp')}</span>
                          </div>
                        )}
                      </div>

                      {payoutItems[payout.id] && payoutItems[payout.id].length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Transaction</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payoutItems[payout.id].map(item => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.transaction_id?.slice(0, 8)}...</TableCell>
                                <TableCell className="text-right">{convertPrice(item.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
