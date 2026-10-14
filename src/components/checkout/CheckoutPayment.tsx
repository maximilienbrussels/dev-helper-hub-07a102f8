/**
 * <CheckoutPayment /> — betaalmethodekeuze met progressive disclosure.
 * Top 3 staan open, de rest achter "Meer betaalopties". Alles verloopt via
 * Stripe en geen enkele keuze verandert het te betalen bedrag.
 */
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import type { PaymentChoice } from "@/lib/payment-methods";

type Item = { id: PaymentChoice; label: string; hint?: string; recommended?: boolean };

const COPY: Record<
  Lang,
  { legend: string; recommended: string; more: string; less: string; noFees: string; items: Record<PaymentChoice, { label: string; hint?: string }> }
> = {
  nl: {
    legend: "Betaalmethode",
    recommended: "Aanbevolen",
    more: "Meer betaalopties (iDEAL, Cartes Bancaires, IBAN)",
    less: "Minder betaalopties",
    noFees: "Geen extra kosten — je betaalt exact het ordertotaal.",
    items: {
      bancontact: { label: "Bancontact" },
      card: { label: "Kaart / Apple Pay / Google Pay" },
      wero: { label: "Wero" },
      ideal: { label: "iDEAL" },
      cartes_bancaires: { label: "Cartes Bancaires" },
      sepa_credit_transfer: {
        label: "Automatische SEPA Overschrijving",
        hint: "Stripe maakt een uniek IBAN + mededeling voor je bestelling.",
      },
      on_pickup: { label: "💶 Betalen bij afhaling" },
    },
  },
  fr: {
    legend: "Mode de paiement",
    recommended: "Recommandé",
    more: "Plus d'options de paiement (iDEAL, Cartes Bancaires, IBAN)",
    less: "Moins d'options",
    noFees: "Aucun frais supplémentaire — vous payez exactement le total.",
    items: {
      bancontact: { label: "Bancontact" },
      card: { label: "Carte / Apple Pay / Google Pay" },
      wero: { label: "Wero" },
      ideal: { label: "iDEAL" },
      cartes_bancaires: { label: "Cartes Bancaires" },
      sepa_credit_transfer: {
        label: "Virement SEPA automatique",
        hint: "Stripe génère un IBAN et une communication uniques.",
      },
      on_pickup: { label: "💶 Payer au retrait" },
    },
  },
  en: {
    legend: "Payment method",
    recommended: "Recommended",
    more: "More payment options (iDEAL, Cartes Bancaires, IBAN)",
    less: "Fewer options",
    noFees: "No extra fees — you pay exactly the order total.",
    items: {
      bancontact: { label: "Bancontact" },
      card: { label: "Card / Apple Pay / Google Pay" },
      wero: { label: "Wero" },
      ideal: { label: "iDEAL" },
      cartes_bancaires: { label: "Cartes Bancaires" },
      sepa_credit_transfer: {
        label: "Automatic SEPA bank transfer",
        hint: "Stripe issues a unique IBAN and reference for your order.",
      },
      on_pickup: { label: "💶 Pay on pickup" },
    },
  },
};

const TOP: PaymentChoice[] = ["bancontact", "card", "wero"];
const EXTRA: PaymentChoice[] = ["ideal", "cartes_bancaires", "sepa_credit_transfer"];

type Props = {
  value: PaymentChoice;
  onChange: (value: PaymentChoice) => void;
  lang: Lang;
  /** Enkel wanneer de beheerder "Betalen bij afhaling" heeft ingeschakeld. */
  payOnPickup?: { enabled: boolean; notice: string };
};

export function CheckoutPayment({ value, onChange, lang, payOnPickup }: Props) {
  const copy = COPY[lang] ?? COPY.nl;
  const [expanded, setExpanded] = useState(EXTRA.includes(value));

  const render = (id: PaymentChoice) => {
    const item: Item = { id, ...copy.items[id], recommended: id === "bancontact" };
    if (id === "on_pickup" && payOnPickup?.notice) item.hint = payOnPickup.notice;
    const active = value === id;
    return (
      <label
        key={id}
        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${
          active
            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
            : "border-border bg-[color:var(--surface-page)] hover:border-primary/50"
        }`}
      >
        <input
          type="radio"
          name="payment-method"
          value={id}
          checked={active}
          onChange={() => onChange(id)}
          className="mt-1 h-4 w-4 accent-[color:var(--color-primary)]"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {item.label}
            {item.recommended && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                {copy.recommended}
              </span>
            )}
          </span>
          {item.hint && (
            <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
          )}
        </span>
      </label>
    );
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {copy.legend}
      </legend>
      <div role="radiogroup" className="space-y-2">
        {TOP.map(render)}
        {payOnPickup?.enabled && render("on_pickup")}
        {expanded && EXTRA.map(render)}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-4 py-2.5 text-xs font-semibold text-foreground/90 hover:border-primary hover:text-primary"
      >
        {expanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {expanded ? copy.less : copy.more}
      </button>
      <p className="text-[11px] text-muted-foreground">{copy.noFees}</p>
    </fieldset>
  );
}
