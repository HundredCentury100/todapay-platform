/**
 * Universal Ticket Number Generator
 * 
 * Logical Format: [VERTICAL]-[YYYYMMDD]-[SEQUENCE]-[CHECKSUM]
 * 
 * Verticals:
 * - BUS: Bus travel tickets
 * - EVT: Event tickets
 * - STY: Stay/accommodation bookings
 * - WRK: Workspace bookings
 * - RDE: Ride-hailing receipts
 * - EXP: Experience bookings
 * - TRF: Transfer services
 * - CAR: Car rental bookings
 * - VEN: Venue bookings
 * 
 * Examples:
 * - BUS-20260129-A7K4-X3
 * - EVT-20260129-B2M9-K7
 * - RDE-20260129-C5P1-N2
 */

export type TicketVertical = 'BUS' | 'EVT' | 'STY' | 'WRK' | 'RDE' | 'EXP' | 'TRF' | 'CAR' | 'VEN';

const VERTICAL_LABELS: Record<TicketVertical, string> = {
  BUS: 'Bus Travel',
  EVT: 'Event',
  STY: 'Stay',
  WRK: 'Workspace',
  RDE: 'Ride',
  EXP: 'Experience',
  TRF: 'Transfer',
  CAR: 'Car Rental',
  VEN: 'Venue',
};

const VERTICAL_COLORS: Record<TicketVertical, { primary: string; gradient: string }> = {
  BUS: { primary: 'hsl(var(--primary))', gradient: 'from-primary to-primary/80' },
  EVT: { primary: 'hsl(280, 70%, 50%)', gradient: 'from-purple-600 via-pink-500 to-purple-600' },
  STY: { primary: 'hsl(36, 100%, 50%)', gradient: 'from-amber-600 via-amber-500 to-amber-600' },
  WRK: { primary: 'hsl(220, 90%, 55%)', gradient: 'from-blue-600 via-blue-500 to-blue-600' },
  RDE: { primary: 'hsl(150, 80%, 40%)', gradient: 'from-emerald-600 via-emerald-500 to-emerald-600' },
  EXP: { primary: 'hsl(340, 80%, 55%)', gradient: 'from-rose-600 via-rose-500 to-rose-600' },
  TRF: { primary: 'hsl(200, 90%, 50%)', gradient: 'from-sky-600 via-sky-500 to-sky-600' },
  CAR: { primary: 'hsl(260, 80%, 55%)', gradient: 'from-violet-600 via-violet-500 to-violet-600' },
  VEN: { primary: 'hsl(30, 90%, 50%)', gradient: 'from-orange-600 via-orange-500 to-orange-600' },
};

/**
 * Generate alphanumeric sequence (excludes confusing characters like 0, O, I, L)
 */
const generateSequence = (length: number = 4): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate checksum (2 character validation code)
 */
const generateChecksum = (input: string): string => {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    sum += input.charCodeAt(i) * (i + 1);
  }
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const first = chars[sum % chars.length];
  const second = chars[(sum * 7) % chars.length];
  return `${first}${second}`;
};

/**
 * Format date as YYYYMMDD
 */
const formatDateCode = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Generate a ticket number for any vertical
 */
export const generateTicketNumber = (
  vertical: TicketVertical,
  date?: Date | string
): string => {
  const dateCode = formatDateCode(date || new Date());
  const sequence = generateSequence(4);
  const baseNumber = `${vertical}-${dateCode}-${sequence}`;
  const checksum = generateChecksum(baseNumber);
  return `${baseNumber}-${checksum}`;
};

/**
 * Generate a booking reference (shorter, human-readable)
 */
export const generateBookingReference = (): string => {
  const sequence = generateSequence(6);
  return sequence;
};

/**
 * Generate receipt number for rides
 */
export const generateReceiptNumber = (rideDate?: Date | string): string => {
  const dateCode = formatDateCode(rideDate || new Date());
  const sequence = generateSequence(4);
  return `RCP-${dateCode}-${sequence}`;
};

/**
 * Parse ticket number to extract components
 */
export const parseTicketNumber = (ticketNumber: string): {
  vertical: TicketVertical;
  date: string;
  sequence: string;
  checksum: string;
  isValid: boolean;
} | null => {
  const parts = ticketNumber.split('-');
  if (parts.length !== 4) return null;

  const [vertical, dateCode, sequence, checksum] = parts;
  
  if (!Object.keys(VERTICAL_LABELS).includes(vertical)) return null;
  
  // Verify checksum
  const baseNumber = `${vertical}-${dateCode}-${sequence}`;
  const expectedChecksum = generateChecksum(baseNumber);
  
  return {
    vertical: vertical as TicketVertical,
    date: `${dateCode.slice(0, 4)}-${dateCode.slice(4, 6)}-${dateCode.slice(6, 8)}`,
    sequence,
    checksum,
    isValid: checksum === expectedChecksum,
  };
};

/**
 * Validate ticket number format and checksum
 */
export const isValidTicketNumber = (ticketNumber: string): boolean => {
  const parsed = parseTicketNumber(ticketNumber);
  return parsed?.isValid ?? false;
};

/**
 * Get vertical display label
 */
export const getVerticalLabel = (vertical: TicketVertical): string => {
  return VERTICAL_LABELS[vertical] || vertical;
};

/**
 * Get vertical color scheme
 */
export const getVerticalColors = (vertical: TicketVertical) => {
  return VERTICAL_COLORS[vertical] || VERTICAL_COLORS.BUS;
};

/**
 * Generate ticket with seat suffix (for buses/events with assigned seating)
 */
export const generateSeatTicketNumber = (
  vertical: TicketVertical,
  seatNumber: string,
  date?: Date | string
): string => {
  const base = generateTicketNumber(vertical, date);
  const seatCode = seatNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4);
  return `${base}-${seatCode}`;
};

export { VERTICAL_LABELS, VERTICAL_COLORS };
