import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Receipt, Download, Eye, FileText } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getCurrentEmployeeAccount, getInvoices, generateInvoice, getInvoiceWithItems } from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee, CorporateInvoice, CorporateInvoiceItem } from '@/types/corporate';
import { toast } from 'sonner';

const CorporateInvoices = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [employee, setEmployee] = useState<CorporateEmployee | null>(null);
  const [invoices, setInvoices] = useState<CorporateInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{ invoice: CorporateInvoice; items: CorporateInvoiceItem[] } | null>(null);
  const [billingPeriod, setBillingPeriod] = useState({
    start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/corporate/invoices'); return; }
    const loadData = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (!result || !result.employee.is_admin) { navigate('/corporate'); return; }
        setAccount(result.account); setEmployee(result.employee);
        setInvoices(await getInvoices(result.account.id));
      } catch (error) { console.error('Error:', error); toast.error('Failed to load invoices'); }
      finally { setLoading(false); }
    };
    if (user) loadData();
  }, [user, authLoading, navigate]);

  const handleGenerateInvoice = async () => {
    if (!account) return;
    setGenerating(true);
    try {
      const invoice = await generateInvoice(account.id, billingPeriod.start, billingPeriod.end, account.payment_terms_days);
      setInvoices([invoice, ...invoices]); setGenerateDialogOpen(false);
      toast.success('Invoice generated successfully');
    } catch (error: any) { toast.error(error.message || 'Failed to generate invoice'); }
    finally { setGenerating(false); }
  };

  const handleViewInvoice = async (invoice: CorporateInvoice) => {
    try { setSelectedInvoice(await getInvoiceWithItems(invoice.id)); setViewDialogOpen(true); }
    catch { toast.error('Failed to load invoice details'); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      paid: { cls: 'bg-green-100 text-green-800', label: 'Paid' },
      sent: { cls: 'bg-blue-100 text-blue-800', label: 'Sent' },
      draft: { cls: '', label: 'Draft' },
      overdue: { cls: 'bg-red-100 text-red-800', label: 'Overdue' },
      cancelled: { cls: '', label: 'Cancelled' },
    };
    const m = map[status];
    if (m?.cls) return <Badge className={m.cls}>{m.label}</Badge>;
    return <Badge variant="secondary">{m?.label || status}</Badge>;
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">View and manage billing invoices</p>
        </div>
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Generate Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate Invoice</DialogTitle><DialogDescription>Create an invoice for approved bookings in the selected period</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Billing Period Start</Label><Input type="date" value={billingPeriod.start} onChange={(e) => setBillingPeriod({ ...billingPeriod, start: e.target.value })} /></div>
              <div className="space-y-2"><Label>Billing Period End</Label><Input type="date" value={billingPeriod.end} onChange={(e) => setBillingPeriod({ ...billingPeriod, end: e.target.value })} /></div>
              <p className="text-sm text-muted-foreground">Payment terms: {account?.payment_terms_days || 30} days</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerateInvoice} disabled={generating}>{generating ? 'Generating...' : 'Generate Invoice'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">R {invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total_amount, 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Paid This Year</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">R {invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Invoices</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{invoices.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />All Invoices</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No invoices yet</p><Button variant="link" onClick={() => setGenerateDialogOpen(true)}>Generate your first invoice</Button></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Billing Period</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.billing_period_start), 'MMM d')} - {format(new Date(invoice.billing_period_end), 'MMM d, yyyy')}</TableCell>
                    <TableCell>R {invoice.total_amount.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}><Eye className="h-4 w-4" /></Button>
                        {invoice.pdf_url && <Button variant="ghost" size="icon" asChild><a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedInvoice && (
            <>
              <DialogHeader><DialogTitle>Invoice {selectedInvoice.invoice.invoice_number}</DialogTitle><DialogDescription>Billing period: {format(new Date(selectedInvoice.invoice.billing_period_start), 'MMM d')} - {format(new Date(selectedInvoice.invoice.billing_period_end), 'MMM d, yyyy')}</DialogDescription></DialogHeader>
              <div className="py-4">
                <Table>
                  <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell><TableCell>{item.employee_name || '-'}</TableCell>
                        <TableCell>{item.travel_date ? format(new Date(item.travel_date), 'MMM d, yyyy') : '-'}</TableCell>
                        <TableCell className="text-right">R {item.total_price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-6 border-t pt-4 space-y-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>R {selectedInvoice.invoice.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>VAT (15%)</span><span>R {selectedInvoice.invoice.tax_amount.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>R {selectedInvoice.invoice.total_amount.toLocaleString()}</span></div>
                </div>
              </div>
              <DialogFooter>
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedInvoice.invoice.status)}
                  <span className="text-sm text-muted-foreground">Due: {format(new Date(selectedInvoice.invoice.due_date), 'MMM d, yyyy')}</span>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorporateInvoices;
