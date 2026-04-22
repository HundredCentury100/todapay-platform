import { describe, it, expect } from "vitest";
import {
  calculateVerticalCommission,
  calculateOverrideCommission,
  mapBookingTypeToVertical,
  getEffectiveTier,
  getTierByBookingCount,
  VERTICAL_BASE_RATES,
  TIER_CONFIGS,
  PAYOUT_DAY,
} from "@/config/agentCommissionConfig";

describe("Agent Commission Config", () => {
  describe("mapBookingTypeToVertical", () => {
    it("maps known booking types correctly", () => {
      expect(mapBookingTypeToVertical("bus")).toBe("bus");
      expect(mapBookingTypeToVertical("event")).toBe("event");
      expect(mapBookingTypeToVertical("stay")).toBe("stay");
      expect(mapBookingTypeToVertical("flight")).toBe("flight");
      expect(mapBookingTypeToVertical("bill_payment")).toBe("bill_payment");
    });

    it("maps aliases correctly", () => {
      expect(mapBookingTypeToVertical("hotel")).toBe("stay");
      expect(mapBookingTypeToVertical("car")).toBe("car_rental");
      expect(mapBookingTypeToVertical("rental")).toBe("car_rental");
    });

    it("defaults to bus for unknown types", () => {
      expect(mapBookingTypeToVertical("unknown")).toBe("bus");
    });
  });

  describe("getEffectiveTier", () => {
    it("returns tier as-is for internal agents", () => {
      expect(getEffectiveTier("platinum", "internal")).toBe("platinum");
      expect(getEffectiveTier("gold", "internal")).toBe("gold");
    });

    it("caps external agents at gold", () => {
      expect(getEffectiveTier("platinum", "external")).toBe("gold");
      expect(getEffectiveTier("gold", "external")).toBe("gold");
      expect(getEffectiveTier("silver", "external")).toBe("silver");
      expect(getEffectiveTier("standard", "external")).toBe("standard");
    });
  });

  describe("getTierByBookingCount", () => {
    it("returns correct tier for booking counts", () => {
      expect(getTierByBookingCount(0).tier).toBe("standard");
      expect(getTierByBookingCount(49).tier).toBe("standard");
      expect(getTierByBookingCount(50).tier).toBe("silver");
      expect(getTierByBookingCount(199).tier).toBe("silver");
      expect(getTierByBookingCount(200).tier).toBe("gold");
      expect(getTierByBookingCount(499).tier).toBe("gold");
      expect(getTierByBookingCount(500).tier).toBe("platinum");
      expect(getTierByBookingCount(1000).tier).toBe("platinum");
    });
  });

  describe("calculateVerticalCommission", () => {
    it("calculates bus commission for standard internal agent", () => {
      const result = calculateVerticalCommission(1000, "bus", "standard", "internal");
      expect(result.baseRate).toBe(3);
      expect(result.multiplier).toBe(1.0);
      expect(result.commissionAmount).toBe(30); // 1000 * 3% * 1.0
      expect(result.effectiveRate).toBe(3);
    });

    it("calculates stay commission for gold internal agent", () => {
      const result = calculateVerticalCommission(1000, "stay", "gold", "internal");
      expect(result.baseRate).toBe(5);
      expect(result.multiplier).toBe(1.5);
      expect(result.commissionAmount).toBe(75); // 1000 * 5% * 1.5
      expect(result.effectiveRate).toBe(7.5);
    });

    it("calculates flight commission for platinum internal agent", () => {
      const result = calculateVerticalCommission(5000, "flight", "platinum", "internal");
      expect(result.baseRate).toBe(2);
      expect(result.multiplier).toBe(1.8);
      expect(result.commissionAmount).toBe(180); // 5000 * 2% * 1.8
    });

    it("caps external agent at gold even if platinum", () => {
      const internal = calculateVerticalCommission(1000, "event", "platinum", "internal");
      const external = calculateVerticalCommission(1000, "event", "platinum", "external");
      
      // Internal platinum: 1000 * 4% * 1.8 = 72
      expect(internal.commissionAmount).toBe(72);
      expect(internal.multiplier).toBe(1.8);
      
      // External capped at gold: 1000 * 4% * 1.5 = 60
      expect(external.commissionAmount).toBe(60);
      expect(external.multiplier).toBe(1.5);
    });

    it("handles flat rate for bill_payment", () => {
      const result = calculateVerticalCommission(100, "bill_payment", "standard", "internal");
      expect(result.baseRate).toBe(0.5);
      expect(result.commissionAmount).toBe(0.5); // flat $0.50 * 1.0x
    });

    it("applies multiplier to flat rate for silver tier", () => {
      const result = calculateVerticalCommission(100, "bill_payment", "silver", "internal");
      expect(result.commissionAmount).toBe(0.6); // $0.50 * 1.2x
    });
  });

  describe("calculateOverrideCommission", () => {
    it("returns 0 for external agents", () => {
      expect(calculateOverrideCommission(1000, 50, "external")).toBe(0);
    });

    it("calculates 2.5% of booking amount for internal agents", () => {
      // 1000 * 2.5% = 25, sub-agent commission = 50, cap = 50*0.5 = 25
      expect(calculateOverrideCommission(1000, 50, "internal")).toBe(25);
    });

    it("caps at 50% of sub-agent commission", () => {
      // 10000 * 2.5% = 250, but sub-agent commission = 100, cap = 50
      expect(calculateOverrideCommission(10000, 100, "internal")).toBe(50);
    });

    it("returns raw override when under cap", () => {
      // 200 * 2.5% = 5, sub-agent commission = 100, cap = 50
      expect(calculateOverrideCommission(200, 100, "internal")).toBe(5);
    });
  });

  describe("constants", () => {
    it("has correct payout day", () => {
      expect(PAYOUT_DAY).toBe("Wednesday");
    });

    it("has all 11 verticals defined", () => {
      expect(Object.keys(VERTICAL_BASE_RATES)).toHaveLength(11);
    });

    it("has 4 tiers defined", () => {
      expect(TIER_CONFIGS).toHaveLength(4);
    });

    it("tiers are sorted descending by min bookings", () => {
      for (let i = 0; i < TIER_CONFIGS.length - 1; i++) {
        expect(TIER_CONFIGS[i].minMonthlyBookings).toBeGreaterThan(TIER_CONFIGS[i + 1].minMonthlyBookings);
      }
    });
  });
});
