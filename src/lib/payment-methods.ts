/**
 * Betaalmethodes die via Stripe verlopen. Geen enkele methode voegt een
 * toeslag toe aan het ordertotaal (PSD2 / EU surcharge-verbod).
 */
export const PAYMENT_CHOICES = [
  "bancontact",
  "card",
  "wero",
  "ideal",
  "cartes_bancaires",
  "sepa_credit_transfer",
  /** Geen Stripe: de klant betaalt contant/Payconiq aan de kassa (admin-toggle). */
  "on_pickup",
] as const;

export type PaymentChoice = (typeof PAYMENT_CHOICES)[number];

/** Stripe payment_method_types voor een gekozen methode. */
export function stripeMethodTypes(choice: PaymentChoice): string[] {
  switch (choice) {
    case "bancontact":
      return ["bancontact", "card"];
    case "ideal":
      return ["ideal", "card"];
    case "cartes_bancaires":
      return ["card"];
    case "sepa_credit_transfer":
      return ["customer_balance"];
    case "wero":
      // Wero wordt door Stripe (nog) niet als eigen methode aangeboden;
      // de klant rondt af via kaart/wallet.
      return ["card"];
    case "on_pickup":
      return [];
    case "card":
    default:
      return ["card"];
  }
}

/** True wanneer Stripe een uniek IBAN + mededeling moet genereren. */
export function isBankTransfer(choice: PaymentChoice): boolean {
  return choice === "sepa_credit_transfer";
}

/** True wanneer de klant pas op de boerderij betaalt (geen Stripe). */
export function isPayOnPickup(choice: PaymentChoice): boolean {
  return choice === "on_pickup";
}
