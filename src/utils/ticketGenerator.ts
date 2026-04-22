/**
 * Enhanced ticket number generation for events and buses
 * Format: [CODE]-[YYYYMMDD]-[HHMM]-[SEQ]-[SEAT]
 * Example Event: KC-20251215-1900-042-VIP3
 * Example Bus: INT-20251203-0800-001-A12
 */

interface TicketNumberParams {
  organizerCode: string;
  eventDate: string;
  eventTime: string;
  seatNumber?: string;
  sequenceNumber?: number;
}

interface BusTicketNumberParams {
  operatorCode: string;
  travelDate: string;
  departureTime: string;
  seatNumber?: string;
  sequenceNumber?: number;
}

export const generateEventTicketNumber = (params: TicketNumberParams): string => {
  const {
    organizerCode,
    eventDate,
    eventTime,
    seatNumber,
    sequenceNumber
  } = params;

  // Parse date: convert YYYY-MM-DD to YYYYMMDD
  const dateStr = eventDate.replace(/-/g, '');

  // Parse time: convert HH:MM to HHMM
  const timeStr = eventTime.replace(/:/g, '').substring(0, 4);

  // Generate sequence number (3 digits)
  const seqStr = sequenceNumber
    ? sequenceNumber.toString().padStart(3, '0')
    : generateRandomSequence(3);

  // Format seat number (default to GA for general admission)
  const seatStr = seatNumber ? formatSeatNumber(seatNumber) : 'GA';

  return `${organizerCode}-${dateStr}-${timeStr}-${seqStr}-${seatStr}`;
};

export const generateBusTicketNumber = (params: BusTicketNumberParams): string => {
  const {
    operatorCode,
    travelDate,
    departureTime,
    seatNumber,
    sequenceNumber
  } = params;

  // Parse date: convert YYYY-MM-DD to YYYYMMDD
  const dateStr = travelDate.replace(/-/g, '');

  // Parse time: convert HH:MM to HHMM
  const timeStr = departureTime.replace(/:/g, '').substring(0, 4);

  // Generate sequence number (3 digits)
  const seqStr = sequenceNumber
    ? sequenceNumber.toString().padStart(3, '0')
    : generateRandomSequence(3);

  // Format seat number
  const seatStr = seatNumber ? formatSeatNumber(seatNumber) : 'XX';

  return `${operatorCode}-${dateStr}-${timeStr}-${seqStr}-${seatStr}`;
};

/**
 * Format seat number to be compact and consistent
 * Examples: A12 -> A12, Row A Seat 12 -> A12, VIP Section 3 -> VIP3
 */
const formatSeatNumber = (seat: string): string => {
  // Remove common prefixes
  let formatted = seat
    .replace(/row\s*/gi, '')
    .replace(/seat\s*/gi, '')
    .replace(/section\s*/gi, '')
    .trim();

  // Remove spaces
  formatted = formatted.replace(/\s+/g, '');

  // Limit to 6 characters
  return formatted.substring(0, 6).toUpperCase();
};

/**
 * Generate a random sequence number
 */
const generateRandomSequence = (digits: number = 3): string => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/**
 * Parse ticket number back into components
 */
export const parseTicketNumber = (ticketNumber: string): {
  code: string;
  date: string;
  time: string;
  sequence: string;
  seat: string;
} | null => {
  const parts = ticketNumber.split('-');
  if (parts.length !== 5) return null;

  const [code, dateStr, timeStr, sequence, seat] = parts;

  // Format date: YYYYMMDD -> YYYY-MM-DD
  const date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

  // Format time: HHMM -> HH:MM
  const time = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;

  return {
    code,
    date,
    time,
    sequence,
    seat
  };
};

/**
 * Validate ticket number format
 */
export const isValidTicketNumber = (ticketNumber: string): boolean => {
  const pattern = /^[A-Z0-9]{2,4}-\d{8}-\d{4}-\d{3}-[A-Z0-9]{2,6}$/;
  return pattern.test(ticketNumber);
};

/**
 * Get organizer code based on event type
 */
export const getOrganizerCodeByType = (eventType: string): string => {
  const typeMap: Record<string, string> = {
    'soccer': 'SCRE',
    'football': 'SCRE',
    'rugby': 'RGBY',
    'cricket': 'CRKT',
    'concert': 'CONC',
    'music': 'MUSC',
    'theatre': 'THTR',
    'sports': 'SPRT',
    'conference': 'CONF',
    'festival': 'FEST',
    'comedy': 'CMDY',
    'exhibition': 'EXBT'
  };

  const type = eventType.toLowerCase();
  return typeMap[type] || 'EVNT';
};

/**
 * Get default operator code from operator name
 */
export const getOperatorCodeFromName = (operatorName: string): string => {
  // Take first 3-4 characters of meaningful words
  const words = operatorName.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return 'BUS';
  
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }
  
  // Take first letter of each word up to 4 characters
  return words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
};
