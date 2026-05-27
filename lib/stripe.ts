import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

export const CREDIT_PACKS = [
  { id: "100", credits: 100, price: 10, label: "Starter" },
  { id: "300", credits: 300, price: 24, label: "Pro", popular: true },
  { id: "600", credits: 600, price: 42, label: "Power" },
] as const;

export type PackId = (typeof CREDIT_PACKS)[number]["id"];
