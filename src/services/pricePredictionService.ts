/**
 * Smart Price Prediction Service
 * Predicts future prices based on historical patterns, demand, and seasonal factors
 */

import { calculateDynamicPrice, OperatorTier } from "@/utils/pricingCalculator";

export interface PricePrediction {
  date: string;
  predictedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'rising' | 'falling' | 'stable';
  recommendation: 'buy_now' | 'wait' | 'neutral';
  factors: string[];
  percentChange: number;
}

export interface PriceAlert {
  id: string;
  userId?: string;
  email: string;
  routeFrom: string;
  routeTo: string;
  targetPrice: number;
  currentPrice: number;
  itemType: 'bus' | 'event';
  itemId: string;
  itemName: string;
  createdAt: string;
  isActive: boolean;
  notifiedAt?: string;
}

// Simulated historical price patterns
const HISTORICAL_PATTERNS = {
  weekday_discount: 0.9,
  weekend_premium: 1.15,
  holiday_premium: 1.35,
  advance_booking_discount: 0.8,
  last_minute_premium: 1.3,
  low_demand_discount: 0.85,
  high_demand_premium: 1.25,
};

// Holiday dates for prediction (simplified)
const HOLIDAYS_2025 = [
  '2025-01-01', '2025-03-21', '2025-04-18', '2025-04-21',
  '2025-04-27', '2025-05-01', '2025-06-16', '2025-08-09',
  '2025-09-24', '2025-12-16', '2025-12-25', '2025-12-26'
];

/**
 * Predict prices for the next N days
 */
export function predictPrices(
  basePrice: number,
  operatorTier: OperatorTier = 'standard',
  startDate: Date = new Date(),
  days: number = 14
): PricePrediction[] {
  const predictions: PricePrediction[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);
    
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayOfWeek = targetDate.getDay();
    const daysInAdvance = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate predicted price using dynamic pricing
    const predictedPrice = calculateDynamicPrice({
      operatorTier,
      basePrice,
      bookingDate: today,
      departureDate: targetDate,
      departureDayOfWeek: dayOfWeek,
    });
    
    // Determine factors affecting price
    const factors: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'high';
    
    // Check if it's a holiday
    if (HOLIDAYS_2025.includes(dateStr)) {
      factors.push('Public holiday (+35%)');
      confidence = 'high';
    }
    
    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
      factors.push('Weekend travel (+15%)');
    }
    
    // Midweek discount
    if (dayOfWeek >= 1 && dayOfWeek <= 3) {
      factors.push('Midweek discount (-10%)');
    }
    
    // Advance booking
    if (daysInAdvance > 14) {
      factors.push('Early bird discount (-20%)');
      confidence = 'medium';
    } else if (daysInAdvance < 3) {
      factors.push('Last minute booking (+30%)');
    }
    
    // Peak season
    const month = targetDate.getMonth() + 1;
    if (month === 7 || month === 12) {
      factors.push('Peak season (+25%)');
    }
    
    // Calculate percent change from base
    const percentChange = Math.round(((predictedPrice - basePrice) / basePrice) * 100);
    
    // Determine trend based on next day prediction
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (i > 0) {
      const prevPrice = predictions[i - 1].predictedPrice;
      if (predictedPrice > prevPrice * 1.05) trend = 'rising';
      else if (predictedPrice < prevPrice * 0.95) trend = 'falling';
    }
    
    // Recommendation logic
    let recommendation: 'buy_now' | 'wait' | 'neutral' = 'neutral';
    if (percentChange <= -15) {
      recommendation = 'buy_now';
    } else if (percentChange >= 20 && daysInAdvance > 7) {
      recommendation = 'wait';
    } else if (trend === 'rising' && daysInAdvance < 5) {
      recommendation = 'buy_now';
    }
    
    // Add demand-based confidence adjustment
    if (daysInAdvance > 21) confidence = 'low';
    
    predictions.push({
      date: dateStr,
      predictedPrice,
      confidence,
      trend,
      recommendation,
      factors: factors.length > 0 ? factors : ['Standard pricing'],
      percentChange,
    });
  }
  
  return predictions;
}

/**
 * Get best day to book based on predictions
 */
export function getBestBookingDay(predictions: PricePrediction[]): PricePrediction | null {
  if (predictions.length === 0) return null;
  
  return predictions.reduce((best, current) => {
    if (current.predictedPrice < best.predictedPrice) return current;
    return best;
  }, predictions[0]);
}

/**
 * Get price trend summary
 */
export function getPriceTrendSummary(predictions: PricePrediction[]): {
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  bestDay: string;
  worstDay: string;
  overallTrend: 'rising' | 'falling' | 'stable';
} {
  if (predictions.length === 0) {
    return {
      lowestPrice: 0,
      highestPrice: 0,
      averagePrice: 0,
      bestDay: '',
      worstDay: '',
      overallTrend: 'stable',
    };
  }
  
  const prices = predictions.map(p => p.predictedPrice);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  
  const bestPrediction = predictions.find(p => p.predictedPrice === lowestPrice)!;
  const worstPrediction = predictions.find(p => p.predictedPrice === highestPrice)!;
  
  // Calculate overall trend
  const firstHalfAvg = prices.slice(0, Math.floor(prices.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(prices.length / 2);
  const secondHalfAvg = prices.slice(Math.floor(prices.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(prices.length / 2);
  
  let overallTrend: 'rising' | 'falling' | 'stable' = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.05) overallTrend = 'rising';
  else if (secondHalfAvg < firstHalfAvg * 0.95) overallTrend = 'falling';
  
  return {
    lowestPrice,
    highestPrice,
    averagePrice,
    bestDay: bestPrediction.date,
    worstDay: worstPrediction.date,
    overallTrend,
  };
}

// Local storage key for price alerts
const PRICE_ALERTS_KEY = 'fulticket_price_alerts';

/**
 * Save price alert to local storage
 */
export function savePriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): PriceAlert {
  const alerts = getPriceAlerts();
  const newAlert: PriceAlert = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  alerts.push(newAlert);
  localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
  
  return newAlert;
}

/**
 * Get all price alerts
 */
export function getPriceAlerts(): PriceAlert[] {
  try {
    const stored = localStorage.getItem(PRICE_ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Delete price alert
 */
export function deletePriceAlert(alertId: string): void {
  const alerts = getPriceAlerts().filter(a => a.id !== alertId);
  localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
}

/**
 * Check if any alerts should be triggered
 */
export function checkPriceAlerts(currentPrices: { itemId: string; price: number }[]): PriceAlert[] {
  const alerts = getPriceAlerts().filter(a => a.isActive);
  const triggeredAlerts: PriceAlert[] = [];
  
  alerts.forEach(alert => {
    const currentPrice = currentPrices.find(p => p.itemId === alert.itemId);
    if (currentPrice && currentPrice.price <= alert.targetPrice) {
      triggeredAlerts.push(alert);
    }
  });
  
  return triggeredAlerts;
}
