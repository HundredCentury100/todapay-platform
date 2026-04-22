import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

const CorporateRegister = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    billing_address: '',
    tax_id: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth?redirect=/corporate/register');
      return;
    }

    setSubmitting(true);
    try {
      // Create corporate account
      const { data: account, error: accountError } = await supabase
        .from('corporate_accounts')
        .insert({
          ...formData,
          account_status: 'pending'
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Create employee record for the registering user (as admin)
      const { error: employeeError } = await supabase
        .from('corporate_employees')
        .insert({
          corporate_account_id: account.id,
          user_id: user.id,
          employee_name: formData.primary_contact_name,
          employee_email: formData.primary_contact_email,
          employee_phone: formData.primary_contact_phone,
          is_admin: true,
          travel_tier: 'vip',
          is_active: true
        });

      if (employeeError) throw employeeError;

      setSubmitted(true);
      toast.success('Corporate account registration submitted');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Corporate Registration</CardTitle>
              <CardDescription>Please sign in to register your company</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/auth?redirect=/corporate/register')}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <CardTitle>Registration Submitted</CardTitle>
              <CardDescription>
                Thank you for registering your corporate account. Our team will review your application and contact you within 2-3 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')}>
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Corporate Account Registration</h1>
            <p className="text-muted-foreground mt-2">
              Register your company for streamlined business travel management
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Provide your company details to set up a corporate account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_email">Company Email *</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                      placeholder="travel@acme.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_phone">Company Phone</Label>
                    <Input
                      id="company_phone"
                      value={formData.company_phone}
                      onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                      placeholder="+27 11 123 4567"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="billing_address">Billing Address</Label>
                    <Textarea
                      id="billing_address"
                      value={formData.billing_address}
                      onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                      placeholder="123 Business Park, Sandton, Johannesburg, 2196"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      placeholder="4123456789"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Primary Contact</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="primary_contact_name">Full Name *</Label>
                      <Input
                        id="primary_contact_name"
                        value={formData.primary_contact_name}
                        onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary_contact_email">Email *</Label>
                      <Input
                        id="primary_contact_email"
                        type="email"
                        value={formData.primary_contact_email}
                        onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                        placeholder="john@acme.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary_contact_phone">Phone</Label>
                      <Input
                        id="primary_contact_phone"
                        value={formData.primary_contact_phone}
                        onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                        placeholder="+27 82 123 4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Corporate Benefits Include:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Centralized billing with net-30 payment terms</li>
                    <li>• Travel policy enforcement and approval workflows</li>
                    <li>• Employee travel management and reporting</li>
                    <li>• Dedicated account manager support</li>
                    <li>• Volume discounts on bookings</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CorporateRegister;
