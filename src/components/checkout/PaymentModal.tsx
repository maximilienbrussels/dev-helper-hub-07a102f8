/**
 * <PaymentModal /> — Stripe Embedded Checkout in een Shadcn-dialoog.
 *
 * Betaalmethodes: kaart, Bancontact en iDEAL (server bepaalt het bedrag).
 * Ontbreken de Stripe-sleutels, dan verschijnt een nette melding in plaats van
 * een gebroken UI.
 */
import { useEffect, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = fetch("/api/stripe-config")
      .then((r) => r.json() as Promise<{ publishableKey: string | null }>)
      .then((d) => (d.publishableKey ? loadStripe(d.publishableKey) : null))
      .catch(() => null);
  }
  return stripePromise;
}

export type PaymentBookingData = {
  product: string;
  naam: string;
  email: string;
  telefoon?: string;
  datum: string;
  personen: number;
  opmerking?: string;
  lang: "nl" | "fr" | "en";
  /** Zichtbare samenvatting (optioneel; anders komt het label van de server). */
  label?: string;
  amountCent?: number;
};

type Props = {
  isOpen: boolean;
  bookingData: PaymentBookingData;
  onClose: () => void;
};

const COPY = {
  nl: {
    title: "Veilig betalen",
    desc: "Kaart, Bancontact of iDEAL — je bevestiging en ticket volgen per e-mail.",
    loading: "Betaalmodule wordt geladen…",
    secure: "Beveiligde betaling via Stripe",
    unavailable:
      "Online betalen is tijdelijk niet beschikbaar. Bel +32 2 331 53 91 of mail info@lafermeduparcmaximilien.be.",
  },
  fr: {
    title: "Paiement sécurisé",
    desc: "Carte, Bancontact ou iDEAL — confirmation et ticket par e-mail.",
    loading: "Chargement du module de paiement…",
    secure: "Paiement sécurisé via Stripe",
    unavailable:
      "Le paiement en ligne est temporairement indisponible. Appelez le +32 2 331 53 91 ou écrivez à info@lafermeduparcmaximilien.be.",
  },
  en: {
    title: "Secure payment",
    desc: "Card, Bancontact or iDEAL — confirmation and ticket by e-mail.",
    loading: "Loading payment module…",
    secure: "Secure payment via Stripe",
    unavailable:
      "Online payment is temporarily unavailable. Call +32 2 331 53 91 or e-mail info@lafermeduparcmaximilien.be.",
  },
} as const;

export function PaymentModal({ isOpen, bookingData, onClose }: Props) {
  const copy = COPY[bookingData.lang] ?? COPY.nl;
  const [stripe, setStripe] = useState<Stripe | null | "loading">("loading");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ label: string; amountCent: number } | null>(
    bookingData.label && typeof bookingData.amountCent === "number"
      ? { label: bookingData.label, amountCent: bookingData.amountCent }
      : null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    void getStripe().then((s) => alive && setStripe(s));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/payments/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...bookingData, uiMode: "embedded" }),
        });
        const data = (await res.json()) as {
          clientSecret?: string | null;
          label?: string;
          amountCent?: number;
          error?: string;
        };
        if (!alive) return;
        if (!res.ok || !data.clientSecret) {
          setError(copy.unavailable);
          return;
        }
        setClientSecret(data.clientSecret);
        if (data.label && typeof data.amountCent === "number") {
          setSummary({ label: data.label, amountCent: data.amountCent });
        }
      } catch {
        if (alive) setError(copy.unavailable);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.desc}</DialogDescription>
        </DialogHeader>

        {summary ? (
          <dl className="flex items-baseline justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-sm">
            <dt className="text-muted-foreground">{summary.label}</dt>
            <dd className="font-semibold">
              {(summary.amountCent / 100).toLocaleString("nl-BE", {
                style: "currency",
                currency: "EUR",
              })}
            </dd>
          </dl>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl bg-muted px-4 py-4 text-sm text-muted-foreground">
            {error}
          </p>
        ) : stripe === "loading" || !clientSecret ? (
          <p className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {copy.loading}
          </p>
        ) : !stripe ? (
          <p role="alert" className="rounded-xl bg-muted px-4 py-4 text-sm text-muted-foreground">
            {copy.unavailable}
          </p>
        ) : (
          <EmbeddedCheckoutProvider stripe={stripe} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> {copy.secure}
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;
