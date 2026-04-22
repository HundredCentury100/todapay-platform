/**
 * Dynamic pricing calculator for bus tickets
 * Applies operator tier multipliers and temporal adjustments
 */

export type OperatorTier = 'budget' | 'standard' | 'premium';

interface PricingFactors {
  operatorTier: OperatorTier;
  basePrice: number;
  bookingDate?: Date;
  departureDate: Date;
  departureDayOfWeek?: number; // 0 = Sunday, 6 = Saturday
}

const TIER_MULTIPLIERS: Record<OperatorTier, number> = {
  budget: 0.7,
  standard: 1.0,
  premium: 1.5,
};

const DAY_OF_WEEK_ADJUSTMENTS: Record<number, number> = {
  0: 1.15, // Sunday
  1: 0.95, // Monday
  2: 0.9,  // Tuesday
  3: 0.9,  // Wednesday
  4: 1.0,  // Thursday
  5: 1.15, // Friday
  6: 1.05, // Saturday
};

const PEAK_MONTHS = [7, 12]; // July and December

/**
 * Calculate dynamic price based on multiple factors
 */
export function calculateDynamicPrice(factors: PricingFactors): number {
  const { operatorTier, basePrice, bookingDate, departureDate, departureDayOfWeek } = factors;
  
  // Start with tier-adjusted base price
  let price = basePrice * TIER_MULTIPLIERS[operatorTier];
  
  // Apply early bird or last minute adjustments
  if (bookingDate) {
    const daysInAdvance = Math.floor(
      (departureDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysInAdvance > 14) {
      // Early bird discount: -20%
      price *= 0.8;
    } else if (daysInAdvance < 2) {
      // Last minute surcharge: +30%
      price *= 1.3;
    }
  }
  
  // Apply peak season surcharge
  const departureMonth = departureDate.getMonth() + 1; // 0-indexed to 1-indexed
  if (PEAK_MONTHS.includes(departureMonth)) {
    price *= 1.25; // +25% peak season
  }
  
  // Apply day-of-week adjustment
  const dayOfWeek = departureDayOfWeek ?? departureDate.getDay();
  price *= DAY_OF_WEEK_ADJUSTMENTS[dayOfWeek];
  
  return Math.round(price);
}

/**
 * Generate price calendar for a date range
 */
export function generatePriceCalendar(
  basePrice: number,
  operatorTier: OperatorTier,
  startDate: Date,
  days: number = 7
): Record<string, number> {
  const priceByDate: Record<string, number> = {};
  const bookingDate = new Date(); // Assume booking today
  
  for (let i = 0; i < days; i++) {
    const departureDate = new Date(startDate);
    departureDate.setDate(startDate.getDate() + i);
    
    const dateKey = departureDate.toISOString().split('T')[0];
    priceByDate[dateKey] = calculateDynamicPrice({
      operatorTier,
      basePrice,
      bookingDate,
      departureDate,
    });
  }
  
  return priceByDate;
}

/**
 * Get price description explaining the factors
 */
export function getPriceDescription(
  basePrice: number,
  finalPrice: number,
  operatorTier: OperatorTier,
  departureDate: Date,
  bookingDate?: Date
): string {
  const factors: string[] = [];
  
  if (operatorTier === 'budget') {
    factors.push('Budget operator (-30%)');
  } else if (operatorTier === 'premium') {
    factors.push('Premium operator (+50%)');
  }
  
  if (bookingDate) {
    const daysInAdvance = Math.floor(
      (departureDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysInAdvance > 14) {
      factors.push('Early bird discount (-20%)');
    } else if (daysInAdvance < 2) {
      factors.push('Last minute booking (+30%)');
    }
  }
  
  const departureMonth = departureDate.getMonth() + 1;
  if (PEAK_MONTHS.includes(departureMonth)) {
    factors.push('Peak season (+25%)');
  }
  
  const dayOfWeek = departureDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 5) {
    factors.push('Weekend premium (+15%)');
  } else if (dayOfWeek === 2 || dayOfWeek === 3) {
    factors.push('Midweek discount (-10%)');
  }
  
  if (factors.length === 0) {
    return 'Standard pricing';
  }
  
  return factors.join(', ');
}
