/**
 * <OrderPaymentModal /> — ingebed Stripe PaymentElement voor een webshopbestelling.
 * Stripe toont zelf Bancontact, kaart, Apple Pay/Google Pay en iDEAL.
 */
import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStripe } from "@/lib/stripe-client";

const COPY = {
  nl: {
    title: "Veilig betalen",
    desc: "Bancontact, kaart, Apple Pay of iDEAL — je blijft op onze site.",
    loading: "Betaalmodule wordt geladen…",
    secure: "Beveiligde betaling via Stripe",
    pay: (amount: string) => `Betaal ${amount}`,
    busy: "Betaling wordt verwerkt…",
    failed: "De betaling kon niet worden afgerond.",
    unavailable:
      "Online betalen is tijdelijk niet beschikbaar. Bel +32 2 331 53 91 of mail info@lafermeduparcmaximilien.be.",
  },
  fr: {
    title: "Paiement sécurisé",
    desc: "Bancontact, carte, Apple Pay ou iDEAL — vous restez sur notre site.",
    loading: "Chargement du module de paiement…",
    secure: "Paiement sécurisé via Stripe",
    pay: (amount: string) => `Payer ${amount}`,
    busy: "Paiement en cours…",
    failed: "Le paiement n'a pas pu être finalisé.",
    unavailable:
      "Le paiement en ligne est temporairement indisponible. Appelez le +32 2 331 53 91 ou écrivez à info@lafermeduparcmaximilien.be.",
  },
  en: {
    title: "Secure payment",
    desc: "Bancontact, card, Apple Pay or iDEAL — you stay on our site.",
    loading: "Loading payment module…",
    secure: "Secure payment via Stripe",
    pay: (amount: string) => `Pay ${amount}`,
    busy: "Processing payment…",
    failed: "The payment could not be completed.",
    unavailable:
      "Online payment is temporarily unavailable. Call +32 2 331 53 91 or e-mail info@lafermeduparcmaximilien.be.",
  },
} as const;

type Lang = keyof typeof COPY;

type Props = {
  isOpen: boolean;
  clientSecret: string | null;
  amountLabel: string;
  returnUrl: string;
  lang: Lang;
  /** Server gaf een initialisatiefout terug (bv. Stripe niet geconfigureerd). */
  serverError?: boolean;
  onClose: () => void;
  onPaid: () => void;
};

function PayForm({
  copy,
  amountLabel,
  returnUrl,
  onPaid,
}: {
  copy: (typeof COPY)[Lang];
  amountLabel: string;
  returnUrl: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message ?? copy.failed);
      setBusy(false);
      return;
    }
    if (paymentIntent && ["succeeded", "processing"].includes(paymentIntent.status)) {
      onPaid();
      return;
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy || !stripe} className="w-full rounded-full">
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {busy ? copy.busy : copy.pay(amountLabel)}
      </Button>
    </form>
  );
}

export function OrderPaymentModal({
  isOpen,
  clientSecret,
  amountLabel,
  returnUrl,
  lang,
  serverError,
  onClose,
  onPaid,
}: Props) {
  const copy = COPY[lang] ?? COPY.nl;
  const [stripe, setStripe] = useState<Stripe | null | "loading">("loading");

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    void getStripe().then((s) => alive && setStripe(s));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  const options = useMemo(
    () =>
      clientSecret
        ? ({
            clientSecret,
            locale: lang,
            appearance: {
              theme: "flat" as const,
              variables: { colorPrimary: "#2F5D3A", borderRadius: "12px", fontSizeBase: "15px" },
            },
          } as const)
        : null,
    [clientSecret, lang],
  );

  const unavailable = serverError || stripe === null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.desc}</DialogDescription>
        </DialogHeader>

        {unavailable ? (
          <p role="alert" className="rounded-xl bg-muted px-4 py-4 text-sm text-muted-foreground">
            {copy.unavailable}
          </p>
        ) : stripe === "loading" || !options ? (
          <p className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {copy.loading}
          </p>
        ) : (
          <Elements stripe={stripe} options={options}>
            <PayForm copy={copy} amountLabel={amountLabel} returnUrl={returnUrl} onPaid={onPaid} />
          </Elements>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> {copy.secure}
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default OrderPaymentModal;
