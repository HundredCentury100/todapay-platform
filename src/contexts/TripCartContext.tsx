import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CartVertical = 'bus' | 'event' | 'stay' | 'workspace' | 'venue' | 'experience' | 'flight' | 'transfer' | 'car_rental' | 'rail';

export interface TripCartItemSnapshot {
  name: string;
  date?: string;
  time?: string;
  location?: string;
  from?: string;
  to?: string;
  image?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  operator?: string;
  propertyName?: string;
  roomName?: string;
  [key: string]: any;
}

export interface TripCartItem {
  id: string;
  vertical: CartVertical;
  itemId: string;
  snapshot: TripCartItemSnapshot;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface TripCartContextType {
  items: TripCartItem[];
  loading: boolean;
  addToCart: (vertical: CartVertical, itemId: string, snapshot: TripCartItemSnapshot, quantity: number, unitPrice: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getBundleDiscount: () => { percentage: number; amount: number };
  getFinalTotal: () => number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const TripCartContext = createContext<TripCartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'fulticket_trip_cart';

export function TripCartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<TripCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [dbCartId, setDbCartId] = useState<string | null>(null);

  // Load cart from localStorage for guests, DB for authenticated
  useEffect(() => {
    if (user) {
      loadCartFromDB();
    } else {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          setItems(JSON.parse(stored));
        } catch { /* ignore */ }
      }
    }
  }, [user]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user]);

  const loadCartFromDB = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get or create active cart
      let { data: cart } = await supabase
        .from('trip_carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('trip_carts')
          .insert({ user_id: user.id, status: 'active' })
          .select('id')
          .single();
        cart = newCart;
      }

      if (cart) {
        setDbCartId(cart.id);
        const { data: cartItems } = await supabase
          .from('trip_cart_items')
          .select('*')
          .eq('cart_id', cart.id)
          .order('created_at', { ascending: true });

        if (cartItems) {
          setItems(cartItems.map(ci => ({
            id: ci.id,
            vertical: ci.vertical as CartVertical,
            itemId: ci.item_id,
            snapshot: ci.item_snapshot as TripCartItemSnapshot,
            quantity: ci.quantity,
            unitPrice: Number(ci.unit_price),
            totalPrice: Number(ci.total_price),
          })));
        }

        // Merge any guest cart items
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            const guestItems: TripCartItem[] = JSON.parse(stored);
            for (const gi of guestItems) {
              const exists = cartItems?.find(ci => ci.item_id === gi.itemId && ci.vertical === gi.vertical);
              if (!exists) {
                await supabase.from('trip_cart_items').insert({
                  cart_id: cart.id,
                  vertical: gi.vertical,
                  item_id: gi.itemId,
                  item_snapshot: gi.snapshot as any,
                  quantity: gi.quantity,
                  unit_price: gi.unitPrice,
                  total_price: gi.totalPrice,
                });
              }
            }
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            // Reload
            const { data: refreshed } = await supabase
              .from('trip_cart_items')
              .select('*')
              .eq('cart_id', cart.id)
              .order('created_at', { ascending: true });
            if (refreshed) {
              setItems(refreshed.map(ci => ({
                id: ci.id,
                vertical: ci.vertical as CartVertical,
                itemId: ci.item_id,
                snapshot: ci.item_snapshot as TripCartItemSnapshot,
                quantity: ci.quantity,
                unitPrice: Number(ci.unit_price),
                totalPrice: Number(ci.total_price),
              })));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback(async (
    vertical: CartVertical,
    itemId: string,
    snapshot: TripCartItemSnapshot,
    quantity: number,
    unitPrice: number
  ) => {
    const totalPrice = quantity * unitPrice;
    const existing = items.find(i => i.itemId === itemId && i.vertical === vertical);

    if (existing) {
      const newQty = existing.quantity + quantity;
      const newTotal = newQty * unitPrice;
      setItems(prev => prev.map(i =>
        i.id === existing.id ? { ...i, quantity: newQty, totalPrice: newTotal } : i
      ));
      if (user && dbCartId) {
        await supabase.from('trip_cart_items')
          .update({ quantity: newQty, total_price: newTotal })
          .eq('id', existing.id);
      }
    } else {
      const newItem: TripCartItem = {
        id: crypto.randomUUID(),
        vertical,
        itemId,
        snapshot,
        quantity,
        unitPrice,
        totalPrice,
      };

      if (user && dbCartId) {
        const { data } = await supabase.from('trip_cart_items')
          .insert({
            cart_id: dbCartId,
            vertical,
            item_id: itemId,
            item_snapshot: snapshot as any,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
          })
          .select('id')
          .single();
        if (data) newItem.id = data.id;
      }

      setItems(prev => [...prev, newItem]);
    }

    toast.success(`Added ${snapshot.name} to your trip`);
  }, [items, user, dbCartId]);

  const removeFromCart = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (user) {
      await supabase.from('trip_cart_items').delete().eq('id', id);
    }
  }, [user]);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, quantity, totalPrice: quantity * i.unitPrice } : i
    ));
    if (user) {
      const item = items.find(i => i.id === id);
      if (item) {
        await supabase.from('trip_cart_items')
          .update({ quantity, total_price: quantity * item.unitPrice })
          .eq('id', id);
      }
    }
  }, [items, user, removeFromCart]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user && dbCartId) {
      await supabase.from('trip_cart_items').delete().eq('cart_id', dbCartId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [user, dbCartId]);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const getBundleDiscount = useCallback(() => {
    const uniqueVerticals = new Set(items.map(i => i.vertical)).size;
    const total = getTotal();
    if (uniqueVerticals >= 3) return { percentage: 5, amount: total * 0.05 };
    if (uniqueVerticals >= 2) return { percentage: 3, amount: total * 0.03 };
    return { percentage: 0, amount: 0 };
  }, [items, getTotal]);

  const getFinalTotal = useCallback(() => {
    return getTotal() - getBundleDiscount().amount;
  }, [getTotal, getBundleDiscount]);

  return (
    <TripCartContext.Provider value={{
      items,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount,
      getBundleDiscount,
      getFinalTotal,
      isCartOpen,
      setCartOpen,
    }}>
      {children}
    </TripCartContext.Provider>
  );
}

export function useTripCart() {
  const context = useContext(TripCartContext);
  if (!context) {
    throw new Error('useTripCart must be used within TripCartProvider');
  }
  return context;
}
