/**
 * Stripe-initialisatie en Checkout Sessions (server-only).
 *
 * Bedragen komen altijd van de server: de browser stuurt enkel een productcode
 * door. Ontbreken de sleutels, dan geeft `stripeConfigured()` false en kan de
 * UI een nette melding tonen in plaats van te crashen.
 */
import Stripe from "stripe";
import { getPublicUrl, PUBLIC_ORIGIN } from "@/lib/urls";
import { isBankTransfer, stripeMethodTypes, type PaymentChoice } from "@/lib/payment-methods";

const API_VERSION = "2025-08-27.basil" as Stripe.LatestApiVersion;

let cached: Stripe | null = null;

export function stripeSecret(): string | null {
  return process.env["STRIPE_SECRET_KEY"] ?? null;
}

export function stripeWebhookSecret(): string | null {
  return process.env["STRIPE_WEBHOOK_SECRET"] ?? null;
}

export function stripeConfigured(): boolean {
  return Boolean(stripeSecret());
}

/** Stripe-client; gooit een duidelijke fout wanneer de sleutel ontbreekt. */
export function stripeServer(): Stripe {
  const key = stripeSecret();
  if (!key) throw new Error("STRIPE_SECRET_KEY ontbreekt — betalingen zijn niet geconfigureerd");
  if (!cached) cached = new Stripe(key, { apiVersion: API_VERSION });
  return cached;
}

/**
 * Stripe aanvaardt enkel volledige http(s)-adressen. In dev geeft
 * `getPublicUrl` een relatief pad terug; dan plakken we er de juiste
 * oorsprong voor (lokale server bij ontwikkeling, live domein in productie).
 */
export function absolutePublicUrl(path: string): string {
  const url = getPublicUrl(path);
  if (/^https?:\/\//i.test(url)) return url;
  const origin = (
    process.env["PUBLIC_SITE_ORIGIN"] ??
    (process.env["NODE_ENV"] === "production" ? PUBLIC_ORIGIN : "http://localhost:8080")
  ).replace(/\/+$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export type CheckoutLocale = "nl" | "fr" | "en";

export type CheckoutSessionInput = {
  amount: number; // in cent
  currency?: "eur";
  description: string;
  customerEmail: string;
  metadata: Record<string, string>;
  locale: CheckoutLocale;
  /** 'embedded' toont de checkout in een dialoog; 'hosted' stuurt door. */
  uiMode?: "embedded" | "hosted";
  returnPath?: string;
  /** Door de klant gekozen betaalmethode (Stripe-only, zonder toeslag). */
  methodChoice?: PaymentChoice;
};

export type CheckoutSessionResult = {
  sessionId: string;
  clientSecret: string | null;
  url: string | null;
};

/** Maakt een Checkout Session met kaart, Bancontact en iDEAL. */
export async function createCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const stripe = stripeServer();
  const uiMode = input.uiMode ?? "embedded";
  const returnPath = input.returnPath ?? "/boeking/bevestiging";
  const returnUrl = `${absolutePublicUrl(returnPath)}${returnPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: (input.methodChoice
      ? stripeMethodTypes(input.methodChoice)
      : ["card", "bancontact", "ideal"]) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    customer_email: input.customerEmail,
    locale: input.locale,
    metadata: input.metadata,
    ...(input.methodChoice && isBankTransfer(input.methodChoice)
      ? {
          // Stripe genereert een uniek IBAN + mededeling voor deze bestelling.
          payment_method_options: {
            customer_balance: {
              funding_type: "bank_transfer",
              bank_transfer: { type: "eu_bank_transfer", eu_bank_transfer: { country: "BE" } },
            },
          } as Stripe.Checkout.SessionCreateParams.PaymentMethodOptions,
          customer_creation: "always" as const,
        }
      : {}),
    payment_intent_data: {
      description: input.description,
      metadata: input.metadata,
      receipt_email: input.customerEmail,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency ?? "eur",
          unit_amount: input.amount,
          product_data: { name: input.description },
        },
      },
    ],
    ...(uiMode === "embedded"
      ? { ui_mode: "embedded" as const, return_url: returnUrl }
      : { success_url: returnUrl, cancel_url: absolutePublicUrl(returnPath) }),
  };

  const session = await stripe.checkout.sessions.create(params);
  return {
    sessionId: session.id,
    clientSecret: session.client_secret ?? null,
    url: session.url ?? null,
  };
}

/** Haalt een sessie op (voor de bevestigingspagina). */
export async function retrieveCheckoutSession(id: string): Promise<Stripe.Checkout.Session> {
  return stripeServer().checkout.sessions.retrieve(id, { expand: ["payment_intent"] });
}
