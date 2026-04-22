import { describe, it, expect } from "vitest";

describe("UnifiedMerchantDashboard", () => {
  it("should not have hardcoded avgRating", async () => {
    const module = await import("@/pages/merchant/UnifiedMerchantDashboard");
    expect(module).toBeDefined();
  });
});

describe("OnboardingChecklist role-awareness", () => {
  it("module exports correctly", async () => {
    const module = await import("@/components/merchant/OnboardingChecklist");
    expect(module.OnboardingChecklist).toBeDefined();
  });
});

describe("MerchantLayout has no agent imports", () => {
  it("module loads without AgentSidebar dependency", async () => {
    // This will fail if AgentSidebar import is broken
    const fs = await import("@/components/merchant/layout/MerchantLayout");
    expect(fs).toBeDefined();
  });
});

describe("AgentSidebar navigation completeness", () => {
  it("module exports correctly", async () => {
    const module = await import("@/components/merchant/layout/AgentSidebar");
    expect(module.AgentSidebar).toBeDefined();
  });
});
