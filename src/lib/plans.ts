import type { Plan } from "@/db/schema";

export const PLAN_LIMITS: Record<
  Plan,
  {
    monthlyArticles: number;
    apiAccess: boolean;
    maxStyleProfiles: number;
    priceLabel: string;
    stripePriceEnv: string | null;
  }
> = {
  free: {
    monthlyArticles: 3,
    apiAccess: false,
    maxStyleProfiles: 1,
    priceLabel: "$0",
    stripePriceEnv: null,
  },
  solo: {
    monthlyArticles: 25,
    apiAccess: true,
    maxStyleProfiles: 3,
    priceLabel: "$9/mo",
    stripePriceEnv: "STRIPE_PRICE_SOLO",
  },
  creator: {
    monthlyArticles: 100,
    apiAccess: true,
    maxStyleProfiles: 10,
    priceLabel: "$19/mo",
    stripePriceEnv: "STRIPE_PRICE_CREATOR",
  },
};

export function planFromPriceId(priceId: string): Plan | null {
  if (priceId === process.env.STRIPE_PRICE_SOLO) return "solo";
  if (priceId === process.env.STRIPE_PRICE_CREATOR) return "creator";
  return null;
}
