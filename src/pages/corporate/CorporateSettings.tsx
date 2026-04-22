import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Building2 } from 'lucide-react';
import { getCurrentEmployeeAccount, updateCorporateAccount } from '@/services/corporateService';
import type { CorporateAccount, CorporateEmployee } from '@/types/corporate';
import { toast } from 'sonner';

const CorporateSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [employee, setEmployee] = useState<CorporateEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '', company_email: '', company_phone: '', billing_address: '',
    tax_id: '', primary_contact_name: '', primary_contact_email: '', primary_contact_phone: '', payment_terms_days: 30,
  });

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth?redirect=/corporate/settings'); return; }
    const load = async () => {
      try {
        const result = await getCurrentEmployeeAccount();
        if (!result || !result.employee.is_admin) { navigate('/corporate'); return; }
        setAccount(result.account); setEmployee(result.employee);
        setForm({
          company_name: result.account.company_name, company_email: result.account.company_email,
          company_phone: result.account.company_phone || '', billing_address: result.account.billing_address || '',
          tax_id: result.account.tax_id || '', primary_contact_name: result.account.primary_contact_name,
          primary_contact_email: result.account.primary_contact_email,
          primary_contact_phone: result.account.primary_contact_phone || '',
          payment_terms_days: result.account.payment_terms_days,
        });
      } catch (error) { console.error('Error:', error); toast.error('Failed to load settings'); }
      finally { setLoading(false); }
    };
    if (user) load();
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);
    try {
      const updated = await updateCorporateAccount(account.id, {
        company_name: form.company_name, company_email: form.company_email,
        company_phone: form.company_phone || undefined, billing_address: form.billing_address || undefined,
        tax_id: form.tax_id || undefined, primary_contact_name: form.primary_contact_name,
        primary_contact_email: form.primary_contact_email,
        primary_contact_phone: form.primary_contact_phone || undefined,
        payment_terms_days: form.payment_terms_days,
      } as Partial<CorporateAccount>);
      setAccount(updated); toast.success('Settings saved successfully');
    } catch (error) { console.error('Error:', error); toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }
  if (!account || !employee) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground">Manage your corporate account details</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Company Information</CardTitle><CardDescription>Update your company details</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Company Email</Label><Input type="email" value={form.company_email} onChange={e => setForm(f => ({ ...f, company_email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Company Phone</Label><Input value={form.company_phone} onChange={e => setForm(f => ({ ...f, company_phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tax ID / VAT Number</Label><Input value={form.tax_id} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Billing Address</Label><Textarea value={form.billing_address} onChange={e => setForm(f => ({ ...f, billing_address: e.target.value }))} rows={3} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Primary Contact</CardTitle><CardDescription>Main point of contact for this account</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Name</Label><Input value={form.primary_contact_name} onChange={e => setForm(f => ({ ...f, primary_contact_name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={form.primary_contact_email} onChange={e => setForm(f => ({ ...f, primary_contact_email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={form.primary_contact_phone} onChange={e => setForm(f => ({ ...f, primary_contact_phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Payment Terms (days)</Label><Input type="number" value={form.payment_terms_days} onChange={e => setForm(f => ({ ...f, payment_terms_days: parseInt(e.target.value) || 30 }))} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Account Status</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Status:</span> {account.account_status.toUpperCase()}</p>
            <p><span className="font-medium text-foreground">Credit Limit:</span> R {account.credit_limit.toLocaleString()}</p>
            <p><span className="font-medium text-foreground">Current Balance:</span> R {account.current_balance.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default CorporateSettings;
