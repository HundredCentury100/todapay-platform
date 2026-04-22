import { createContext, useContext, useState, ReactNode } from 'react';
import { Room } from '@/types/stay';
import { toast } from 'sonner';

interface CartItem {
  room: Room;
  quantity: number;
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  totalPrice: number;
  nights: number;
}

interface StayBookingCartContextType {
  items: CartItem[];
  propertyId: string | null;
  propertyName: string | null;
  addToCart: (room: Room, quantity: number, checkIn: string, checkOut: string, pricePerNight: number, nights: number, propertyId: string, propertyName: string) => void;
  removeFromCart: (roomId: string) => void;
  updateQuantity: (roomId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalRooms: () => number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const StayBookingCartContext = createContext<StayBookingCartContextType | undefined>(undefined);

export function StayBookingCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string | null>(null);
  const [isCartOpen, setCartOpen] = useState(false);

  const addToCart = (
    room: Room,
    quantity: number,
    checkIn: string,
    checkOut: string,
    pricePerNight: number,
    nights: number,
    propId: string,
    propName: string
  ) => {
    // Check if adding from different property
    if (propertyId && propertyId !== propId) {
      toast.error('You can only book rooms from one property at a time. Clear your cart first.');
      return;
    }

    const existingIndex = items.findIndex(item => item.room.id === room.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity,
        totalPrice: (newItems[existingIndex].quantity + quantity) * pricePerNight * nights
      };
      setItems(newItems);
    } else {
      // Add new item
      setItems([
        ...items,
        {
          room,
          quantity,
          checkIn,
          checkOut,
          pricePerNight,
          totalPrice: quantity * pricePerNight * nights,
          nights
        }
      ]);
    }

    setPropertyId(propId);
    setPropertyName(propName);
    toast.success(`Added ${room.name} to cart`);
  };

  const removeFromCart = (roomId: string) => {
    const newItems = items.filter(item => item.room.id !== roomId);
    setItems(newItems);
    
    if (newItems.length === 0) {
      setPropertyId(null);
      setPropertyName(null);
    }
  };

  const updateQuantity = (roomId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(roomId);
      return;
    }

    setItems(items.map(item => 
      item.room.id === roomId 
        ? { ...item, quantity, totalPrice: quantity * item.pricePerNight * item.nights }
        : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    setPropertyId(null);
    setPropertyName(null);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getTotalRooms = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <StayBookingCartContext.Provider
      value={{
        items,
        propertyId,
        propertyName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalRooms,
        isCartOpen,
        setCartOpen
      }}
    >
      {children}
    </StayBookingCartContext.Provider>
  );
}

export function useStayBookingCart() {
  const context = useContext(StayBookingCartContext);
  if (!context) {
    throw new Error('useStayBookingCart must be used within StayBookingCartProvider');
  }
  return context;
}
