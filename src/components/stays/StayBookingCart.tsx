import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useStayBookingCart } from '@/contexts/StayBookingCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function StayBookingCart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    propertyId,
    propertyName,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalRooms,
    isCartOpen,
    setCartOpen
  } = useStayBookingCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please sign in to complete your booking');
      navigate('/auth');
      return;
    }

    // Navigate to property page with cart checkout intent
    if (propertyId) {
      setCartOpen(false);
      navigate(`/stays/${propertyId}?checkout=true`);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating Cart Button */}
      {!isCartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">{getTotalRooms()} room{getTotalRooms() !== 1 ? 's' : ''}</span>
          <Badge variant="secondary" className="ml-1">
            ${getTotalPrice().toLocaleString()}
          </Badge>
        </button>
      )}

      <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Booking
              </span>
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear All
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <div className="mb-4">
              <h3 className="font-semibold">{propertyName}</h3>
              {items[0] && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(items[0].checkIn), 'MMM d')} - {format(new Date(items[0].checkOut), 'MMM d, yyyy')}
                  {' '}({items[0].nights} night{items[0].nights !== 1 ? 's' : ''})
                </p>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-4 pr-4">
                {items.map((item) => (
                  <div key={item.room.id} className="flex gap-4 p-3 border rounded-lg">
                    {item.room.images?.[0] ? (
                      <img
                        src={item.room.images[0]}
                        alt={item.room.name}
                        className="w-20 h-20 rounded object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded bg-muted flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.room.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.pricePerNight}/night
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.room.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.room.id, item.quantity + 1)}
                            disabled={item.quantity >= item.room.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeFromCart(item.room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <SheetFooter className="mt-auto border-t pt-4">
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({getTotalRooms()} room{getTotalRooms() !== 1 ? 's' : ''})</span>
                   <span>${getTotalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Taxes & Fees</span>
                  <span>Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                   <span>${getTotalPrice().toLocaleString()}</span>
                 </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue to Checkout
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
