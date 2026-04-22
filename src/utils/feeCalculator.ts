/**
 * Centralized fee calculation utilities for the platform.
 *
 * Platform fee: 10% charged to merchants (not on bill payments).
 * Service fee: $1 per $50 subtotal charged to customers.
 * Bill payments: no platform fee; service fee only on non-ZESA/non-airtime billers.
 */

export const PLATFORM_FEE_PERCENTAGE = 10;

/** Customer service fee: $1 for every $50 in the subtotal */
export const calculateServiceFee = (subtotal: number): number => {
  return Math.floor(subtotal / 50);
};

/** Merchant platform fee (10%) */
export const calculatePlatformFee = (
  amount: number
): { feePercentage: number; feeAmount: number; merchantAmount: number } => {
  const feeAmount = Math.round(amount * 0.10 * 100) / 100;
  const merchantAmount = Math.round((amount - feeAmount) * 100) / 100;
  return { feePercentage: PLATFORM_FEE_PERCENTAGE, feeAmount, merchantAmount };
};

const EXEMPT_BILLERS = ['zesa', 'econet', 'netone', 'telecel'];

/** Returns true if the vertical/biller combination is exempt from service fees */
export const isServiceFeeExempt = (
  vertical: string,
  billerName?: string
): boolean => {
  if (vertical !== 'bill_payment') return false;
  if (!billerName) return false;
  return EXEMPT_BILLERS.includes(billerName.toLowerCase());
};
