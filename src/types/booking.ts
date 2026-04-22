export interface Bus {
  id: string;
  operator: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  amenities: string[];
  image?: string;
  images?: string[];
  type: 'national' | 'crossborder';
  stops?: string[];
  pickupAddress?: string;
  dropoffAddress?: string;
  priceByDate?: Record<string, number>;
  operatorTier?: 'budget' | 'standard' | 'premium';
  trending?: boolean;
  rating?: number;
  reviewCount?: number;
  busClass?: BusClass[];
  baggageAllowance?: BaggageAllowance;
  onTimePercentage?: number;
  fleetSize?: number;
  weeklyBookings?: number;
}

export type BusClassTier = 'standard' | 'premium' | 'vip';

export interface BusClass {
  tier: BusClassTier;
  price: number;
  amenities: string[];
  baggage: BaggageAllowance;
  seatType: string;
}

export interface BaggageAllowance {
  bags: number;
  weightPerBag: number;
  carryOn: boolean;
}

export interface Event {
  id: string;
  name: string;
  type: string;
  location: string;
  venue: string;
  date: string;
  time: string;
  price: number;
  availableTickets: number;
  description: string;
  image?: string;
  images?: string[];
  trending?: boolean;
  category?: string;
  region?: string;
}

export interface Seat {
  id: string;
  number: string;
  row: number;
  column: number;
  status: 'available' | 'selected' | 'booked' | 'cash_reserved';
  type: 'regular' | 'premium';
}

export interface PassengerInfo {
  name: string;
  email: string;
  phone: string;
  passportNumber: string;
  nextOfKinNumber: string;
  whatsappNumber: string;
}

export interface BookingData {
  type: 'bus' | 'event';
  itemId: string;
  itemName: string;
  selectedSeats?: string[];
  ticketQuantity?: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passportNumber?: string;
  nextOfKinNumber?: string;
  whatsappNumber?: string;
  finalDestinationCity?: string;
  isReturnTicket?: boolean;
  returnDate?: string;
  numberOfAdults?: number;
  numberOfChildren?: number;
  numberOfBags?: number;
  luggageWeight?: number;
  passengers?: PassengerInfo[];
  totalPrice: number;
  departureTime?: string;
  arrivalTime?: string;
  operator?: string;
  from?: string;
  to?: string;
  date?: string;
  seatPreferences?: any;
  flexiOptions?: { flexiTicket: boolean; cancellationInsurance: boolean; payLater: boolean };
  selectedMeals?: any[];
  specialAssistance?: any;
  petTravel?: any;
  groupDiscount?: number;
  tripInsurance?: any;
  reservationType?: string;
  reservationExpiresAt?: string;
  isCashReservation?: boolean;
  // Event-specific fields
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  eventCategory?: string;
  categorySpecificData?: Record<string, any>;
  selectedAddons?: Record<string, number>;
  accessibilityNeeds?: Record<string, any>;
}
