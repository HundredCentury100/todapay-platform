export interface SeatPreference {
  windowOrAisle: 'window' | 'aisle' | 'any';
  position: 'front' | 'middle' | 'back' | 'any';
  quietZone: boolean;
  nearExit: boolean;
}

export interface SeatRating {
  seatNumber: string;
  rating: number;
  reviews: number;
  tags: string[];
}

export interface BookingHistory {
  id: string;
  busId: string;
  operator: string;
  from: string;
  to: string;
  date: string;
  seats: string[];
  totalPrice: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  ticketNumber: string;
}

export interface FlexiBookingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export interface MealOption {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface SpecialAssistance {
  wheelchair: boolean;
  elderly: boolean;
  childTravelingAlone: boolean;
  medical: string;
}

export interface PetTravel {
  hasPet: boolean;
  petType: string;
  petWeight: number;
  petCarrier: boolean;
}

export interface PriceHistory {
  date: string;
  price: number;
}

export interface MultiStopJourney {
  stops: {
    from: string;
    to: string;
    date: string;
  }[];
}
