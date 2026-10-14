/**
 * <CheckoutModal /> — officiële Stripe Embedded Checkout in een dialoog.
 *
 * De klant blijft op onze eigen site; het iframe van Stripe toont zelf
 * Bancontact, Visa, Mastercard, Apple Pay en iDEAL.
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

const COPY = {
  nl: {
    title: "Veilig betalen",
    desc: "Bancontact, Visa, Mastercard, Apple Pay of iDEAL — je blijft op onze site.",
    loading: "Betaalmodule wordt geladen…",
    secure: "Beveiligde betaling via Stripe",
    unavailable:
      "Online betalen is tijdelijk niet beschikbaar. Bel +32 2 331 53 91 of mail info@lafermeduparcmaximilien.be.",
  },
  fr: {
    title: "Paiement sécurisé",
    desc: "Bancontact, Visa, Mastercard, Apple Pay ou iDEAL — vous restez sur notre site.",
    loading: "Chargement du module de paiement…",
    secure: "Paiement sécurisé via Stripe",
    unavailable:
      "Le paiement en ligne est temporairement indisponible. Appelez le +32 2 331 53 91 ou écrivez à info@lafermeduparcmaximilien.be.",
  },
  en: {
    title: "Secure payment",
    desc: "Bancontact, Visa, Mastercard, Apple Pay or iDEAL — you stay on our site.",
    loading: "Loading payment module…",
    secure: "Secure payment via Stripe",
    unavailable:
      "Online payment is temporarily unavailable. Call +32 2 331 53 91 or e-mail info@lafermeduparcmaximilien.be.",
  },
} as const;

type Props = {
  isOpen: boolean;
  clientSecret: string | null;
  lang: "nl" | "fr" | "en";
  onClose: () => void;
};

export function CheckoutModal({ isOpen, clientSecret, lang, onClose }: Props) {
  const copy = COPY[lang] ?? COPY.nl;
  const [stripe, setStripe] = useState<Stripe | null | "loading">("loading");

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    void getStripe().then((s) => {
      if (alive) setStripe(s);
    });
    return () => {
      alive = false;
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.desc}</DialogDescription>
        </DialogHeader>

        {stripe === "loading" || !clientSecret ? (
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

export default CheckoutModal;
