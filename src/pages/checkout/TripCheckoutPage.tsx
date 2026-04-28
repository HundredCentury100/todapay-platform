import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader2, CheckCircle, Bus, Ticket, Hotel, Briefcase, MapPin, Compass, Plane, Car, Train, Shield, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BackButton from '@/components/BackButton';
import MobileAppLayout from '@/components/MobileAppLayout';
import { useTripCart, CartVertical } from '@/contexts/TripCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import omariLogo from "@/assets/omari-logo.png";
import innbucksLogo from "@/assets/innbucks-logo.png";
import { TodaPayCheckout, OmariCheckout, InnBucksCheckout, WalletPayment } from "@/components/checkout";

const verticalIcons: Record<CartVertical, React.ElementType> = {
  bus: Bus, event: Ticket, stay: Hotel, workspace: Briefcase,
  venue: MapPin, experience: Compass, flight: Plane,
  transfer: Car, car_rental: Car, rail: Train,
};

const verticalLabels: Record<CartVertical, string> = {
  bus: 'Bus', event: 'Event', stay: 'Stay', workspace: 'Workspace',
  venue: 'Venue', experience: 'Experience', flight: 'Flight',
  transfer: 'Transfer', car_rental: 'Car Rental', rail: 'Rail',
};

type PaymentView = 'methods' | 'todapay' | 'omari' | 'innbucks';

export default function TripCheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { convertPrice } = useCurrency();
  const { items, getTotal, getBundleDiscount, getFinalTotal, clearCart } = useTripCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingRefs, setBookingRefs] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [paymentView, setPaymentView] = useState<PaymentView>('methods');

  const discount = getBundleDiscount();
  const finalTotal = getFinalTotal();

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('full_name, email, phone').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setForm({ name: data.full_name || '', email: data.email || '', phone: data.phone || '' });
        });
    }
  }, [user]);

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.vertical]) acc[item.vertical] = [];
    acc[item.vertical].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const generateRef = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  };

  const handleSubmit = async (paymentMethod: string = 'cash') => {
    if (!form.name || !form.email || !form.phone) {
      toast.error('Please fill in all contact details');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const refs: string[] = [];
      for (const item of items) {
        const ref = generateRef();
        refs.push(ref);
        const ticketNum = `TRP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const itemDiscountShare = discount.amount > 0 ? (item.totalPrice / getTotal()) * discount.amount : 0;
        const finalItemPrice = item.totalPrice - itemDiscountShare;

        await supabase.from('bookings').insert({
          booking_type: item.vertical, vertical: item.vertical, item_id: item.itemId,
          item_name: item.snapshot.name, passenger_name: form.name, passenger_email: form.email,
          passenger_phone: form.phone, guest_email: form.email, base_price: item.totalPrice,
          total_price: finalItemPrice, ticket_number: ticketNum, booking_reference: ref,
          ticket_quantity: item.quantity, user_id: user?.id || null,
          status: paymentMethod === 'cash' ? 'pending' : 'confirmed',
          payment_status: paymentMethod === 'cash' ? 'cash_pending' : 'completed',
          from_location: item.snapshot.from || null, to_location: item.snapshot.to || null,
          travel_date: item.snapshot.date || null,
          group_discount: itemDiscountShare > 0 ? discount.percentage : null,
          category_specific_data: { trip_bundle: true, bundle_discount_percentage: discount.percentage, snapshot: item.snapshot, payment_method: paymentMethod } as any,
        });
      }

      if (user) {
        const { data: cart } = await supabase.from('trip_carts').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle();
        if (cart) await supabase.from('trip_carts').update({ status: 'checked_out' }).eq('id', cart.id);
      }

      setBookingRefs(refs);
      setSuccess(true);
      clearCart();
      toast.success('Trip booked successfully!');
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <MobileAppLayout>
        <div className="p-4 pt-2"><BackButton /></div>
        <div className="p-4 flex flex-col items-center text-center pt-8">
          <CheckCircle className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Trip Booked!</h1>
          <p className="text-muted-foreground mb-6">Your {bookingRefs.length} service{bookingRefs.length !== 1 ? 's' : ''} have been booked successfully.</p>
          <Card className="w-full mb-6">
            <CardHeader><CardTitle className="text-base">Booking References</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {bookingRefs.map((ref, i) => (
                <div key={ref} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm text-muted-foreground">Booking {i + 1}</span>
                  <span className="font-mono font-bold">{ref}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          {discount.percentage > 0 && (
            <Badge variant="secondary" className="mb-4 text-primary">🎉 You saved {convertPrice(discount.amount)} with bundle discount!</Badge>
          )}
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/orders')}>View Orders</Button>
            <Button className="flex-1" onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </MobileAppLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MobileAppLayout>
        <div className="p-4 pt-2"><BackButton /></div>
        <div className="p-4 flex flex-col items-center text-center pt-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">Your trip cart is empty</p>
          <Button className="mt-4" onClick={() => navigate('/')}>Browse Services</Button>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <MobileAppLayout pageTitle="Trip Checkout">
      <div className="p-4 pt-2">
        <BackButton />
        <h1 className="text-xl font-bold mt-2">Trip Checkout</h1>
      </div>
      <div className="p-4 space-y-4 pb-32">
        {Object.entries(grouped).map(([vertical, groupItems]) => {
          const Icon = verticalIcons[vertical as CartVertical] || ShoppingCart;
          return (
            <Card key={vertical}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />{verticalLabels[vertical as CartVertical]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {groupItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.snapshot.name}</p>
                      {item.snapshot.date && <p className="text-xs text-muted-foreground">{item.snapshot.date}</p>}
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-sm ml-2">{convertPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label htmlFor="name">Full Name</Label><Input id="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-12" /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-12" /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-12" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal ({items.length} items)</span><span>{convertPrice(getTotal())}</span></div>
            {discount.percentage > 0 && (
              <div className="flex justify-between text-sm text-primary"><span>🎉 Bundle Savings ({discount.percentage}%)</span><span>-{convertPrice(discount.amount)}</span></div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{convertPrice(finalTotal)}</span></div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Payment Method</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {paymentView === 'todapay' ? (
              <TodaPayCheckout amount={finalTotal} reason={`Trip Bundle (${items.length} services)`} onCancel={() => setPaymentView('methods')} onPaymentComplete={() => handleSubmit('payment_gateway')} />
            ) : paymentView === 'omari' ? (
              <OmariCheckout amount={finalTotal} reference={`trip-${Date.now()}`} currency="USD" description={`Trip Bundle (${items.length} services)`} onCancel={() => setPaymentView('methods')} onSuccess={() => handleSubmit('omari')} />
            ) : paymentView === 'innbucks' ? (
              <InnBucksCheckout amount={finalTotal} reference={`trip-${Date.now()}`} currency="USD" description={`Trip Bundle (${items.length} services)`} onCancel={() => setPaymentView('methods')} onSuccess={() => handleSubmit('innbucks')} />
            ) : (
              <>
                <Button onClick={() => setPaymentView('todapay')} className="w-full h-12 rounded-full font-semibold" disabled={loading}>
                  <Shield className="w-4 h-4 mr-2" />Pay with TodaPay
                </Button>
                <Button onClick={() => setPaymentView('omari')} variant="outline" className="w-full h-11 rounded-full font-semibold border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400" disabled={loading}>
                  <img src={omariLogo} alt="O'mari" className="w-5 h-5 object-contain mr-2" />Pay with O'mari
                </Button>
                <Button onClick={() => setPaymentView('innbucks')} variant="outline" className="w-full h-11 rounded-full font-semibold border-orange-500/30 text-orange-600 hover:bg-orange-500/10 dark:text-orange-400" disabled={loading}>
                  <img src={innbucksLogo} alt="InnBucks" className="w-5 h-5 object-contain mr-2" />Pay with InnBucks
                </Button>
                {user && <WalletPayment amount={finalTotal} onPaymentComplete={() => handleSubmit('wallet')} disabled={loading} />}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                </div>
                <Button onClick={() => handleSubmit('cash')} variant="outline" className="w-full h-11 rounded-full font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
                  Reserve & Pay Cash
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky bottom pay bar */}
      {paymentView === 'methods' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40 pb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] md:pb-4">
          <Button className="w-full h-12 rounded-xl" onClick={() => setPaymentView('todapay')} disabled={loading}>
            <Shield className="w-4 h-4 mr-2" />Pay {convertPrice(finalTotal)}
          </Button>
        </div>
      )}
    </MobileAppLayout>
  );
}
