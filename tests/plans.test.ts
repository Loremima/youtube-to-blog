import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PLAN_LIMITS, planFromPriceId } from "../src/lib/plans";

describe("PLAN_LIMITS", () => {
  it("matches the spec pricing (free/solo/creator quotas + API access)", () => {
    expect(PLAN_LIMITS.free).toMatchObject({
      monthlyArticles: 3,
      apiAccess: false,
    });
    expect(PLAN_LIMITS.solo).toMatchObject({
      monthlyArticles: 25,
      apiAccess: true,
      stripePriceEnv: "STRIPE_PRICE_SOLO",
    });
    expect(PLAN_LIMITS.creator).toMatchObject({
      monthlyArticles: 100,
      apiAccess: true,
      stripePriceEnv: "STRIPE_PRICE_CREATOR",
    });
  });
});

describe("planFromPriceId", () => {
  const originalSolo = process.env.STRIPE_PRICE_SOLO;
  const originalCreator = process.env.STRIPE_PRICE_CREATOR;

  beforeEach(() => {
    process.env.STRIPE_PRICE_SOLO = "price_solo_test";
    process.env.STRIPE_PRICE_CREATOR = "price_creator_test";
  });
  afterEach(() => {
    process.env.STRIPE_PRICE_SOLO = originalSolo;
    process.env.STRIPE_PRICE_CREATOR = originalCreator;
  });

  it("maps configured Stripe price ids to plans", () => {
    expect(planFromPriceId("price_solo_test")).toBe("solo");
    expect(planFromPriceId("price_creator_test")).toBe("creator");
  });
  it("returns null for unknown price ids", () => {
    expect(planFromPriceId("price_unknown")).toBeNull();
    expect(planFromPriceId("")).toBeNull();
  });
});
