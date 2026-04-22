/**
 * Agent Compensation Structure Configuration
 * 
 * Vertical-specific base rates, tier multipliers, and role-based rules.
 * Payout day: Wednesday
 */

export type BookingVertical =
  | 'bus'
  | 'event'
  | 'stay'
  | 'property'
  | 'car_rental'
  | 'flight'
  | 'workspace'
  | 'transfer'
  | 'experience'
  | 'venue'
  | 'bill_payment';

export type AgentTier = 'standard' | 'silver' | 'gold' | 'platinum';
export type AgentType = 'internal' | 'external';

// --- Vertical Base Rates ---

interface VerticalRate {
  type: 'percentage' | 'flat';
  value: number; // percentage (e.g. 3 = 3%) or flat dollar amount
}

export const VERTICAL_BASE_RATES: Record<BookingVertical, VerticalRate> = {
  bus:          { type: 'percentage', value: 3 },
  event:        { type: 'percentage', value: 4 },
  stay:         { type: 'percentage', value: 5 },
  property:     { type: 'percentage', value: 5 },
  car_rental:   { type: 'percentage', value: 4 },
  flight:       { type: 'percentage', value: 2 },
  workspace:    { type: 'percentage', value: 3 },
  transfer:     { type: 'percentage', value: 3 },
  experience:   { type: 'percentage', value: 5 },
  venue:        { type: 'percentage', value: 5 },
  bill_payment: { type: 'flat', value: 0.50 },
};

// --- Tier Multipliers ---

export interface TierConfig {
  tier: AgentTier;
  multiplier: number;
  minMonthlyBookings: number;
}

export const TIER_CONFIGS: TierConfig[] = [
  { tier: 'platinum', multiplier: 1.8, minMonthlyBookings: 500 },
  { tier: 'gold',     multiplier: 1.5, minMonthlyBookings: 200 },
  { tier: 'silver',   multiplier: 1.2, minMonthlyBookings: 50 },
  { tier: 'standard', multiplier: 1.0, minMonthlyBookings: 0 },
];

export const getTierConfig = (tier: AgentTier): TierConfig => {
  return TIER_CONFIGS.find(t => t.tier === tier) || TIER_CONFIGS[TIER_CONFIGS.length - 1];
};

export const getTierByBookingCount = (bookingCount: number): TierConfig => {
  return TIER_CONFIGS.find(c => bookingCount >= c.minMonthlyBookings) || TIER_CONFIGS[TIER_CONFIGS.length - 1];
};

// --- Role-Based Rules ---

/** External agents are capped at Gold tier */
export const EXTERNAL_AGENT_MAX_TIER: AgentTier = 'gold';

/** Only internal agents can earn override commissions */
export const canEarnOverrideCommission = (agentType: AgentType): boolean => {
  return agentType === 'internal';
};

/** Cap the effective tier for external agents */
export const getEffectiveTier = (tier: AgentTier, agentType: AgentType): AgentTier => {
  if (agentType === 'external') {
    const tierOrder: AgentTier[] = ['standard', 'silver', 'gold', 'platinum'];
    const maxIndex = tierOrder.indexOf(EXTERNAL_AGENT_MAX_TIER);
    const currentIndex = tierOrder.indexOf(tier);
    if (currentIndex > maxIndex) return EXTERNAL_AGENT_MAX_TIER;
  }
  return tier;
};

// --- Override Commission ---

export const OVERRIDE_COMMISSION_RATE = 0.025; // 2.5% of sub-agent booking amount
export const OVERRIDE_COMMISSION_CAP = 0.50;   // Capped at 50% of sub-agent's own commission

// --- Payout Schedule ---

export const PAYOUT_DAY = 'Wednesday';
export const PAYOUT_DAY_NUMBER = 3; // 0=Sunday, 3=Wednesday

// --- Commission Calculation ---

/**
 * Calculate the effective commission for an agent booking.
 * Returns the commission amount in dollars.
 */
export const calculateVerticalCommission = (
  bookingAmount: number,
  vertical: BookingVertical,
  agentTier: AgentTier,
  agentType: AgentType
): { commissionAmount: number; effectiveRate: number; baseRate: number; multiplier: number } => {
  const rate = VERTICAL_BASE_RATES[vertical];
  const effectiveTier = getEffectiveTier(agentTier, agentType);
  const tierConfig = getTierConfig(effectiveTier);

  let baseCommission: number;
  let baseRate: number;

  if (rate.type === 'flat') {
    // Flat fee — multiplier still applies
    baseCommission = rate.value * tierConfig.multiplier;
    baseRate = rate.value;
  } else {
    baseRate = rate.value;
    baseCommission = bookingAmount * (rate.value / 100) * tierConfig.multiplier;
  }

  const effectiveRate = rate.type === 'percentage'
    ? rate.value * tierConfig.multiplier
    : rate.value * tierConfig.multiplier; // For display purposes

  return {
    commissionAmount: Math.round(baseCommission * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    baseRate: rate.value,
    multiplier: tierConfig.multiplier,
  };
};

/**
 * Calculate override commission for a referrer agent.
 * Only internal agents qualify. Capped at 50% of sub-agent's commission.
 */
export const calculateOverrideCommission = (
  bookingAmount: number,
  subAgentCommission: number,
  referrerAgentType: AgentType
): number => {
  if (!canEarnOverrideCommission(referrerAgentType)) return 0;

  const rawOverride = bookingAmount * OVERRIDE_COMMISSION_RATE;
  const cap = subAgentCommission * OVERRIDE_COMMISSION_CAP;
  return Math.round(Math.min(rawOverride, cap) * 100) / 100;
};

/**
 * Map a booking_type string to a BookingVertical.
 */
export const mapBookingTypeToVertical = (bookingType: string): BookingVertical => {
  const mapping: Record<string, BookingVertical> = {
    bus: 'bus',
    event: 'event',
    stay: 'stay',
    property: 'property',
    car_rental: 'car_rental',
    flight: 'flight',
    workspace: 'workspace',
    transfer: 'transfer',
    experience: 'experience',
    venue: 'venue',
    bill_payment: 'bill_payment',
    // Common aliases
    hotel: 'stay',
    accommodation: 'stay',
    car: 'car_rental',
    rental: 'car_rental',
  };
  return mapping[bookingType.toLowerCase()] || 'bus';
};
