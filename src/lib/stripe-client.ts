/**
 * Stripe.js in de browser. De publiceerbare sleutel komt bij voorkeur uit
 * `VITE_STRIPE_PUBLISHABLE_KEY`; ontbreekt die in de bundel, dan vragen we
 * ze aan de server (/api/stripe-config). Pas als beide leeg zijn is online
 * betalen echt niet beschikbaar.
 */
import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (stripePromise) return stripePromise;
  const bundled = (import.meta.env["VITE_STRIPE_PUBLISHABLE_KEY"] as string | undefined)?.trim();
  if (bundled) {
    stripePromise = loadStripe(bundled).catch(() => null);
    return stripePromise;
  }
  stripePromise = fetch("/api/stripe-config")
    .then((r) => r.json() as Promise<{ publishableKey: string | null }>)
    .then((d) => (d.publishableKey ? loadStripe(d.publishableKey) : null))
    .catch(() => null);
  return stripePromise;
}
