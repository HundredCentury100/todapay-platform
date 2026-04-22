import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Bus, Calendar, Hotel, MapPin, Ticket, Briefcase, Plane, Car, Train, Compass } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTripCart, CartVertical } from '@/contexts/TripCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const verticalIcons: Record<CartVertical, React.ElementType> = {
  bus: Bus,
  event: Ticket,
  stay: Hotel,
  workspace: Briefcase,
  venue: MapPin,
  experience: Compass,
  flight: Plane,
  transfer: Car,
  car_rental: Car,
  rail: Train,
};

const verticalLabels: Record<CartVertical, string> = {
  bus: 'Bus',
  event: 'Event',
  stay: 'Stay',
  workspace: 'Workspace',
  venue: 'Venue',
  experience: 'Experience',
  flight: 'Flight',
  transfer: 'Transfer',
  car_rental: 'Car Rental',
  rail: 'Rail',
};

export function TripCartSheet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    getBundleDiscount,
    getFinalTotal,
    isCartOpen,
    setCartOpen,
  } = useTripCart();

  // Group items by vertical
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.vertical]) acc[item.vertical] = [];
    acc[item.vertical].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const discount = getBundleDiscount();

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please sign in to checkout');
      navigate('/auth');
      return;
    }
    setCartOpen(false);
    navigate('/checkout/trip');
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Trip ({getItemCount()} items)
            </span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                Clear
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Your trip cart is empty</p>
              <p className="text-sm">Add services from any category</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {Object.entries(grouped).map(([vertical, groupItems]) => {
                const Icon = verticalIcons[vertical as CartVertical] || ShoppingCart;
                return (
                  <div key={vertical}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {verticalLabels[vertical as CartVertical] || vertical}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupItems.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 border rounded-lg bg-card">
                          {item.snapshot.image ? (
                            <img
                              src={item.snapshot.image}
                              alt={item.snapshot.name}
                              className="w-16 h-16 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <Icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.snapshot.name}</h4>
                            {item.snapshot.date && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {item.snapshot.date}
                              </p>
                            )}
                            {item.snapshot.from && item.snapshot.to && (
                              <p className="text-xs text-muted-foreground">
                                {item.snapshot.from} → {item.snapshot.to}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive ml-1"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <span className="font-semibold text-sm">
                                ${item.totalPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <SheetFooter className="border-t p-4 mt-auto">
            <div className="w-full space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${getTotal().toLocaleString()}</span>
                </div>
                {discount.percentage > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span className="flex items-center gap-1">
                      🎉 Bundle Savings ({discount.percentage}%)
                    </span>
                    <span>-${discount.amount.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${getFinalTotal().toLocaleString()}</span>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Checkout Trip
              </Button>
              {discount.percentage === 0 && new Set(items.map(i => i.vertical)).size === 1 && (
                <p className="text-xs text-center text-muted-foreground">
                  Add another service type to save 3% on your trip!
                </p>
              )}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
