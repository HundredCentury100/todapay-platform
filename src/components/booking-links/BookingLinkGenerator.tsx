import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createBookingLink, getBookingLinkUrl, type CreateBookingLinkParams } from '@/services/bookingLinkService';
import ShareLinkActions from './ShareLinkActions';

interface BookingLinkGeneratorProps {
  merchantProfileId?: string;
  corporateAccountId?: string;
  onLinkCreated?: () => void;
}

const SERVICE_TYPES = [
  { value: 'event', label: 'Event' },
  { value: 'bus', label: 'Bus Route' },
  { value: 'venue', label: 'Venue' },
  { value: 'stay', label: 'Stay / Accommodation' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'experience', label: 'Experience' },
  { value: 'transfer', label: 'Transfer' },
];

const BookingLinkGenerator = ({ merchantProfileId, corporateAccountId, onLinkCreated }: BookingLinkGeneratorProps) => {
  const [linkType, setLinkType] = useState<'booking' | 'payment'>('booking');
  const [serviceType, setServiceType] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!serviceType || !serviceName) {
      toast.error('Please fill in service type and name');
      return;
    }

    setLoading(true);
    try {
      const params: CreateBookingLinkParams = {
        merchant_profile_id: merchantProfileId,
        corporate_account_id: corporateAccountId,
        link_type: linkType,
        service_type: serviceType,
        service_id: serviceId || crypto.randomUUID(),
        service_name: serviceName,
        currency,
        preset_config: promoCode ? { promo_code: promoCode } : {},
      };

      if (linkType === 'payment' && fixedAmount) {
        params.fixed_amount = parseFloat(fixedAmount);
      }
      if (hasMaxUses && maxUses) {
        params.max_uses = parseInt(maxUses);
      }
      if (hasExpiry && expiresAt) {
        params.expires_at = new Date(expiresAt).toISOString();
      }
      if (customMessage) {
        params.custom_message = customMessage;
      }

      const link = await createBookingLink(params);
      const url = getBookingLinkUrl(link.link_code);
      setGeneratedLink(url);
      toast.success('Booking link created!');
      onLinkCreated?.();
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setServiceType('');
    setServiceId('');
    setServiceName('');
    setFixedAmount('');
    setMaxUses('');
    setExpiresAt('');
    setCustomMessage('');
    setPromoCode('');
    setHasExpiry(false);
    setHasMaxUses(false);
  };

  if (generatedLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Link Generated!
          </CardTitle>
          <CardDescription>Share this link with your customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
            {generatedLink}
          </div>
          <ShareLinkActions linkUrl={generatedLink} serviceName={serviceName} />
          <Button variant="outline" onClick={resetForm} className="w-full">
            Create Another Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Generate Booking Link
        </CardTitle>
        <CardDescription>Create a shareable link for your services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link Type */}
        <div className="space-y-2">
          <Label>Link Type</Label>
          <Select value={linkType} onValueChange={(v) => setLinkType(v as 'booking' | 'payment')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="booking">Booking Link</SelectItem>
              <SelectItem value="payment">Payment Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Service Type */}
        <div className="space-y-2">
          <Label>Service Type</Label>
          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map(st => (
                <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Name */}
        <div className="space-y-2">
          <Label>Service Name</Label>
          <Input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="e.g., Summer Music Festival" />
        </div>

        {/* Service ID (optional) */}
        <div className="space-y-2">
          <Label>Service ID (optional)</Label>
          <Input value={serviceId} onChange={e => setServiceId(e.target.value)} placeholder="UUID of the service" />
        </div>

        {/* Payment Link: Fixed Amount */}
        {linkType === 'payment' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fixed Amount</Label>
              <Input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ZWL">ZWL</SelectItem>
                  <SelectItem value="ZAR">ZAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Promo Code */}
        <div className="space-y-2">
          <Label>Promo Code (optional)</Label>
          <Input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="e.g., CORP20" />
        </div>

        {/* Max Uses */}
        <div className="flex items-center justify-between">
          <Label>Limit number of uses</Label>
          <Switch checked={hasMaxUses} onCheckedChange={setHasMaxUses} />
        </div>
        {hasMaxUses && (
          <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Max uses" />
        )}

        {/* Expiry */}
        <div className="flex items-center justify-between">
          <Label>Set expiry date</Label>
          <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
        </div>
        {hasExpiry && (
          <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        )}

        {/* Custom Message */}
        <div className="space-y-2">
          <Label>Custom Message (optional)</Label>
          <Textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Welcome message shown when link is opened" rows={3} />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
          Generate Link
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingLinkGenerator;
